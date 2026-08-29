const mongoose = require('mongoose');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const TransactionLog = require('../models/TransactionLog');
const {
  TRANSACTION_STATUS,
  DAILY_TRANSFER_LIMIT,
  LOG_ACTION,
  NOTIFICATION_TYPE,
  RISK_LEVEL,
  ROLES,
} = require('../config/constants');
const ApiError = require('../utils/ApiError');
const { runInTransaction } = require('../utils/runTransaction');
const { assessRisk } = require('./fraud.service');
const notificationService = require('./notification.service');
const { verifyTwoFactorToken } = require('./twoFactor.service');

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

async function findRecipient(identifier) {
  const query = identifier.includes('@')
    ? { email: identifier.toLowerCase() }
    : { walletId: identifier.toUpperCase() };

  const user = await User.findOne(query);
  if (!user || !user.isActive) {
    throw new ApiError(404, 'Recipient not found');
  }
  return user;
}

async function getDailyOutboundTotal(senderId) {
  const result = await Transaction.aggregate([
    {
      $match: {
        sender: senderId,
        status: { $in: [TRANSACTION_STATUS.SUCCESS, TRANSACTION_STATUS.PENDING] },
        createdAt: { $gte: startOfToday() },
      },
    },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);

  return result[0]?.total || 0;
}

async function recordFailedAttempt({ sender, receiver, amount, description, reason, risk, idempotencyKey }) {
  const txn = await Transaction.create({
    sender: sender._id,
    receiver: receiver?._id || sender._id,
    amount,
    description,
    status: TRANSACTION_STATUS.FAILED,
    failureReason: reason,
    riskLevel: risk?.level || RISK_LEVEL.LOW,
    riskScore: risk?.score || 0,
    riskFactors: risk?.factors || [],
    idempotencyKey,
  });

  await TransactionLog.create({
    transaction: txn._id,
    action: LOG_ACTION.FAILED,
    actor: sender._id,
    details: reason,
  });

  await notificationService.createNotification({
    userId: sender._id,
    type: NOTIFICATION_TYPE.TRANSFER_FAILED,
    message: `Transfer of ${amount.toLocaleString()} BDT failed. ${reason}`,
    metadata: { transactionId: txn.transactionId },
  });

  return txn;
}

async function sendMoney({
  senderId,
  recipient,
  amount,
  description,
  idempotencyKey,
  password,
  twoFactorToken,
  requireTwoFactor = false,
}) {
  amount = Number(amount);

  const sender = await User.findById(senderId).select('+password +twoFactorSecret');
  if (!sender || !sender.isActive) {
    throw new ApiError(401, 'Account is unavailable');
  }

  if (sender.role === ROLES.ADMIN) {
    throw new ApiError(403, 'Admin accounts cannot send money');
  }

  if (!password) {
    throw new ApiError(400, 'Enter your password to confirm this transfer');
  }

  const passwordOk = await sender.comparePassword(password);
  if (!passwordOk) {
    throw new ApiError(400, 'Incorrect password. Transfer cancelled.');
  }

  // TOTP only for the Send Money route — group/request pay stays password-only.
  if (requireTwoFactor && sender.isTwoFactorEnabled !== false) {
    const totpOk = verifyTwoFactorToken(sender.twoFactorSecret, twoFactorToken);
    if (!totpOk) {
      throw new ApiError(400, 'Invalid 2FA Authenticator Code');
    }
  }

  if (idempotencyKey) {
    const existing = await Transaction.findOne({ idempotencyKey });
    if (existing) {
      await existing.populate(['sender', 'receiver']);
      return existing;
    }
  }

  const receiver = await findRecipient(recipient);

  if (receiver.role === ROLES.ADMIN) {
    throw new ApiError(400, 'You cannot send money to an admin account');
  }

  if (sender._id.equals(receiver._id)) {
    throw new ApiError(400, 'You cannot send money to your own wallet');
  }

  const risk = await assessRisk({
    senderId: sender._id,
    receiverId: receiver._id,
    amount,
  });

  const dailyTotal = await getDailyOutboundTotal(sender._id);
  if (dailyTotal + amount > DAILY_TRANSFER_LIMIT) {
    const remaining = Math.max(0, DAILY_TRANSFER_LIMIT - dailyTotal);
    const txn = await recordFailedAttempt({
      sender,
      receiver,
      amount,
      description,
      reason: `Daily transfer limit of ${DAILY_TRANSFER_LIMIT.toLocaleString()} BDT exceeded. Remaining today: ${remaining.toLocaleString()} BDT.`,
      risk,
      idempotencyKey,
    });

    throw new ApiError(400, txn.failureReason, { transactionId: txn.transactionId, remaining });
  }

  if (sender.walletBalance < amount) {
    const txn = await recordFailedAttempt({
      sender,
      receiver,
      amount,
      description,
      reason: 'Insufficient wallet balance',
      risk,
      idempotencyKey,
    });
    throw new ApiError(400, txn.failureReason, { transactionId: txn.transactionId });
  }

  try {
    const created = await runInTransaction(async (session) => {
      const opts = session ? { session } : {};

      const debit = await User.findOneAndUpdate(
        { _id: sender._id, walletBalance: { $gte: amount } },
        { $inc: { walletBalance: -amount } },
        { new: true, ...opts }
      );

      if (!debit) {
        throw new ApiError(400, 'Insufficient wallet balance');
      }

      const credit = await User.findByIdAndUpdate(
        receiver._id,
        { $inc: { walletBalance: amount } },
        { new: true, ...opts }
      );

      if (!credit) {
        await User.findByIdAndUpdate(sender._id, { $inc: { walletBalance: amount } }, opts);
        throw new ApiError(500, 'Recipient wallet could not be credited');
      }

      const [txn] = await Transaction.create(
        [
          {
            sender: sender._id,
            receiver: receiver._id,
            amount,
            description: description || '',
            status: TRANSACTION_STATUS.SUCCESS,
            riskLevel: risk.level,
            riskScore: risk.score,
            riskFactors: risk.factors,
            idempotencyKey,
          },
        ],
        session ? { session } : {}
      );

      await TransactionLog.create(
        [
          {
            transaction: txn._id,
            action: LOG_ACTION.COMPLETED,
            actor: sender._id,
            details: 'Transfer settled atomically',
            snapshot: {
              senderBalance: debit.walletBalance,
              receiverBalance: credit.walletBalance,
            },
          },
        ],
        session ? { session } : {}
      );

      await notificationService.createNotification({
        userId: sender._id,
        type: NOTIFICATION_TYPE.TRANSFER_SENT,
        message: `You successfully sent ${amount.toLocaleString()} BDT to ${receiver.name}.`,
        metadata: { transactionId: txn.transactionId },
        session,
      });

      await notificationService.createNotification({
        userId: receiver._id,
        type: NOTIFICATION_TYPE.TRANSFER_RECEIVED,
        message: `You received ${amount.toLocaleString()} BDT from ${sender.name}.`,
        metadata: { transactionId: txn.transactionId },
        session,
      });

      if (risk.level === RISK_LEVEL.HIGH) {
        await notificationService.createNotification({
          userId: sender._id,
          type: NOTIFICATION_TYPE.SECURITY_WARNING,
          message: `Security notice: this ${amount.toLocaleString()} BDT transfer was flagged as high risk.`,
          metadata: { transactionId: txn.transactionId, factors: risk.factors },
          session,
        });
      }

      return txn;
    });

    await created.populate(['sender', 'receiver']);
    return created;
  } catch (error) {
    if (error instanceof ApiError) throw error;

    await recordFailedAttempt({
      sender,
      receiver,
      amount,
      description,
      reason: 'Transfer could not be completed. No funds were lost.',
      risk,
    });

    throw new ApiError(500, 'Transfer could not be completed. Please try again.');
  }
}

async function listTransactions(userId, { status, direction, search, from, to, page = 1, limit = 20 }) {
  const filter = {
    $or: [{ sender: userId }, { receiver: userId }],
  };

  if (status) filter.status = status.toUpperCase();

  if (direction === 'sent') {
    filter.$or = [{ sender: userId }];
  } else if (direction === 'received') {
    filter.$or = [{ receiver: userId }];
  }

  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = end;
    }
  }

  if (search) {
    filter.transactionId = { $regex: search.trim(), $options: 'i' };
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    Transaction.find(filter)
      .populate('sender', 'name email walletId')
      .populate('receiver', 'name email walletId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Transaction.countDocuments(filter),
  ]);

  return { items, total, page: Number(page), limit: Number(limit) };
}

function findByIdOrTxnId(id) {
  const query = [{ transactionId: id }];
  if (mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === id) {
    query.push({ _id: id });
  }
  return Transaction.findOne({ $or: query });
}

async function getTransaction(userId, id, isAdmin = false) {
  const txn = await findByIdOrTxnId(id)
    .populate('sender', 'name email walletId')
    .populate('receiver', 'name email walletId')
    .populate('reversedBy', 'name email');

  if (!txn) throw new ApiError(404, 'Transaction not found');

  const involved =
    txn.sender._id.equals(userId) || txn.receiver._id.equals(userId);

  if (!involved && !isAdmin) {
    throw new ApiError(403, 'You cannot view this transaction');
  }

  const logs = await TransactionLog.find({ transaction: txn._id }).sort({ timestamp: 1 });

  return { transaction: txn, logs };
}

async function reverseTransaction({ adminId, transactionRef }) {
  const txn = await findByIdOrTxnId(transactionRef).populate(['sender', 'receiver']);

  if (!txn) throw new ApiError(404, 'Transaction not found');
  if (txn.status !== TRANSACTION_STATUS.SUCCESS) {
    throw new ApiError(400, 'Only successful transactions can be reversed');
  }

  await runInTransaction(async (session) => {
    const opts = session ? { session } : {};

    const receiverDebit = await User.findOneAndUpdate(
      { _id: txn.receiver._id, walletBalance: { $gte: txn.amount } },
      { $inc: { walletBalance: -txn.amount } },
      { new: true, ...opts }
    );

    if (!receiverDebit) {
      throw new ApiError(400, 'Receiver no longer has sufficient balance to reverse this transfer');
    }

    await User.findByIdAndUpdate(
      txn.sender._id,
      { $inc: { walletBalance: txn.amount } },
      opts
    );

    txn.status = TRANSACTION_STATUS.REVERSED;
    txn.reversedAt = new Date();
    txn.reversedBy = adminId;
    await txn.save(opts);

    await TransactionLog.create(
      [
        {
          transaction: txn._id,
          action: LOG_ACTION.REVERSED,
          actor: adminId,
          details: 'Admin reversed a completed transfer',
          snapshot: { amount: txn.amount },
        },
      ],
      session ? { session } : {}
    );

    await notificationService.createNotification({
      userId: txn.sender._id,
      type: NOTIFICATION_TYPE.TRANSFER_REVERSED,
      message: `A transfer of ${txn.amount.toLocaleString()} BDT to ${txn.receiver.name} was reversed. Funds have been returned.`,
      metadata: { transactionId: txn.transactionId },
      session,
    });

    await notificationService.createNotification({
      userId: txn.receiver._id,
      type: NOTIFICATION_TYPE.TRANSFER_REVERSED,
      message: `${txn.amount.toLocaleString()} BDT received from ${txn.sender.name} was reversed by SecurePay.`,
      metadata: { transactionId: txn.transactionId },
      session,
    });
  });

  return txn;
}

module.exports = {
  sendMoney,
  listTransactions,
  getTransaction,
  reverseTransaction,
  getDailyOutboundTotal,
};
