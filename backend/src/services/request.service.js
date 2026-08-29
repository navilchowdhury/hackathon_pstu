const User = require('../models/User');
const MoneyRequest = require('../models/MoneyRequest');
const ApiError = require('../utils/ApiError');
const {
  ROLES,
  MONEY_REQUEST_STATUS,
  NOTIFICATION_TYPE,
} = require('../config/constants');
const notificationService = require('./notification.service');
const transactionService = require('./transaction.service');

const POPULATE = [
  { path: 'requester', select: 'name email walletId' },
  { path: 'payer', select: 'name email walletId' },
  { path: 'transaction', select: 'transactionId status amount' },
];

async function findWalletUser(identifier) {
  const query = identifier.includes('@')
    ? { email: identifier.toLowerCase() }
    : { walletId: identifier.toUpperCase() };
  const user = await User.findOne(query);
  if (!user || !user.isActive || user.role === ROLES.ADMIN) {
    throw new ApiError(404, 'No SecurePay user found for that email or wallet ID');
  }
  return user;
}

async function createRequest({ userId, recipient, amount, description }) {
  const requester = await User.findById(userId);
  if (!requester || requester.role === ROLES.ADMIN) {
    throw new ApiError(403, 'Admin accounts cannot request money');
  }

  const payer = await findWalletUser(recipient.trim());
  if (payer._id.equals(requester._id)) {
    throw new ApiError(400, 'You cannot request money from yourself');
  }

  const request = await MoneyRequest.create({
    requester: requester._id,
    payer: payer._id,
    amount: Number(amount),
    description: description || '',
    status: MONEY_REQUEST_STATUS.PENDING,
  });

  await notificationService.createNotification({
    userId: payer._id,
    type: NOTIFICATION_TYPE.MONEY_REQUEST,
    message: `${requester.name} requested ${Number(amount).toLocaleString()} BDT from you.`,
    metadata: { requestId: String(request._id) },
  });

  return request.populate(POPULATE);
}

async function listRequests(userId) {
  const items = await MoneyRequest.find({
    $or: [{ requester: userId }, { payer: userId }],
  })
    .populate(POPULATE)
    .sort({ createdAt: -1 })
    .limit(100);

  return {
    incoming: items.filter((r) => r.payer._id.equals(userId)),
    outgoing: items.filter((r) => r.requester._id.equals(userId)),
  };
}

async function getOwnedRequest(requestId, userId) {
  const request = await MoneyRequest.findById(requestId).populate(POPULATE);
  if (!request) throw new ApiError(404, 'Money request not found');

  const involved = request.requester._id.equals(userId) || request.payer._id.equals(userId);
  if (!involved) throw new ApiError(403, 'You cannot access this request');
  return request;
}

async function payRequest({ userId, requestId, password }) {
  const request = await getOwnedRequest(requestId, userId);
  if (!request.payer._id.equals(userId)) {
    throw new ApiError(403, 'Only the requested payer can pay this');
  }
  if (request.status !== MONEY_REQUEST_STATUS.PENDING) {
    throw new ApiError(400, 'This request is no longer pending');
  }

  const txn = await transactionService.sendMoney({
    senderId: userId,
    recipient: request.requester.email,
    amount: request.amount,
    description: request.description
      ? `Money request · ${request.description}`
      : `Money request from ${request.requester.name}`,
    password,
    idempotencyKey: `money-request-${request._id}`,
  });

  request.status = MONEY_REQUEST_STATUS.PAID;
  request.transaction = txn._id;
  await request.save();

  await notificationService.createNotification({
    userId: request.requester._id,
    type: NOTIFICATION_TYPE.MONEY_REQUEST_PAID,
    message: `${request.payer.name} paid your ${request.amount.toLocaleString()} BDT request.`,
    metadata: { requestId: String(request._id), transactionId: txn.transactionId },
  });

  return request.populate(POPULATE);
}

async function declineRequest({ userId, requestId }) {
  const request = await getOwnedRequest(requestId, userId);
  if (!request.payer._id.equals(userId)) {
    throw new ApiError(403, 'Only the requested payer can decline this');
  }
  if (request.status !== MONEY_REQUEST_STATUS.PENDING) {
    throw new ApiError(400, 'This request is no longer pending');
  }

  request.status = MONEY_REQUEST_STATUS.DECLINED;
  await request.save();

  await notificationService.createNotification({
    userId: request.requester._id,
    type: NOTIFICATION_TYPE.MONEY_REQUEST_DECLINED,
    message: `${request.payer.name} declined your ${request.amount.toLocaleString()} BDT request.`,
    metadata: { requestId: String(request._id) },
  });

  return request;
}

async function cancelRequest({ userId, requestId }) {
  const request = await getOwnedRequest(requestId, userId);
  if (!request.requester._id.equals(userId)) {
    throw new ApiError(403, 'Only the requester can cancel this');
  }
  if (request.status !== MONEY_REQUEST_STATUS.PENDING) {
    throw new ApiError(400, 'This request is no longer pending');
  }

  request.status = MONEY_REQUEST_STATUS.CANCELLED;
  await request.save();
  return request;
}

module.exports = {
  createRequest,
  listRequests,
  payRequest,
  declineRequest,
  cancelRequest,
};
