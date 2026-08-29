const Group = require('../models/Group');
const Expense = require('../models/Expense');
const Settlement = require('../models/Settlement');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const {
  ROLES,
  SETTLEMENT_STATUS,
  NOTIFICATION_TYPE,
} = require('../config/constants');
const { computeExpenseNets, applyPaidSettlements, greedySettlements } = require('../utils/settle');
const notificationService = require('./notification.service');
const transactionService = require('./transaction.service');

function isMember(group, userId) {
  return group.members.some((m) => m.equals(userId) || m._id?.equals(userId));
}

async function findRegisteredUser(identifier) {
  const query = identifier.includes('@')
    ? { email: identifier.toLowerCase() }
    : { walletId: identifier.toUpperCase() };
  const user = await User.findOne(query);
  if (!user || !user.isActive || user.role === ROLES.ADMIN) {
    throw new ApiError(404, 'No SecurePay user found for that email or wallet ID');
  }
  return user;
}

async function rebuildPendingSettlements(groupId) {
  const group = await Group.findById(groupId);
  const expenses = await Expense.find({ group: groupId });
  const paid = await Settlement.find({
    group: groupId,
    status: SETTLEMENT_STATUS.PAID,
  });

  const memberIds = group.members.map((id) => String(id));
  const { nets } = computeExpenseNets(memberIds, expenses);
  const remaining = applyPaidSettlements(nets, paid);
  const requests = greedySettlements(remaining);

  await Settlement.deleteMany({ group: groupId, status: SETTLEMENT_STATUS.PENDING });

  if (requests.length === 0) return [];

  const created = await Settlement.create(
    requests.map((row) => ({
      group: groupId,
      from: row.from,
      to: row.to,
      amount: row.amount,
      status: SETTLEMENT_STATUS.PENDING,
    }))
  );

  for (const row of created) {
    await notificationService.createNotification({
      userId: row.to,
      type: NOTIFICATION_TYPE.GROUP_REQUEST,
      message: `You have a ${row.amount.toLocaleString()} BDT group settlement request in "${group.name}".`,
      metadata: { groupId: String(groupId), settlementId: String(row._id) },
    });
  }

  return created;
}

async function createGroup({ userId, name, members = [] }) {
  const creator = await User.findById(userId);
  if (!creator || creator.role === ROLES.ADMIN) {
    throw new ApiError(403, 'Only wallet users can create groups');
  }

  const unique = new Map();
  unique.set(String(creator._id), creator._id);

  for (const identifier of members) {
    if (!identifier || !String(identifier).trim()) continue;
    const user = await findRegisteredUser(String(identifier).trim());
    unique.set(String(user._id), user._id);
  }

  if (unique.size < 2) {
    throw new ApiError(400, 'Add at least one other SecurePay user to the group');
  }

  const group = await Group.create({
    name: name.trim(),
    createdBy: creator._id,
    members: [...unique.values()],
  });

  return group.populate(['createdBy', 'members']);
}

async function listGroups(userId) {
  return Group.find({ members: userId })
    .populate('createdBy', 'name email walletId')
    .populate('members', 'name email walletId')
    .sort({ updatedAt: -1 });
}

async function getGroupOrThrow(groupId, userId) {
  const group = await Group.findById(groupId)
    .populate('createdBy', 'name email walletId')
    .populate('members', 'name email walletId');

  if (!group) throw new ApiError(404, 'Group not found');
  if (!isMember(group, userId)) {
    throw new ApiError(403, 'You are not a member of this group');
  }
  return group;
}

async function getGroupDetail(groupId, userId) {
  const group = await getGroupOrThrow(groupId, userId);
  const expenses = await Expense.find({ group: groupId })
    .populate('paidBy', 'name email walletId')
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 });
  const settlements = await Settlement.find({ group: groupId })
    .populate('from', 'name email walletId')
    .populate('to', 'name email walletId')
    .populate('transaction', 'transactionId status amount')
    .sort({ createdAt: -1 });

  const memberIds = group.members.map((m) => String(m._id));
  const summary = computeExpenseNets(memberIds, expenses);
  const paidSettlements = settlements.filter((s) => s.status === SETTLEMENT_STATUS.PAID);
  const remainingNets = applyPaidSettlements(summary.nets, paidSettlements);

  const balances = group.members.map((member) => {
    const expenseRow = summary.nets.find((n) => n.id === String(member._id));
    const remaining = remainingNets.find((n) => n.id === String(member._id));
    const memberId = String(member._id);
    const settledPaid = paidSettlements
      .filter((s) => String(s.to._id || s.to) === memberId)
      .reduce((sum, s) => sum + s.amount, 0);
    const settledReceived = paidSettlements
      .filter((s) => String(s.from._id || s.from) === memberId)
      .reduce((sum, s) => sum + s.amount, 0);

    return {
      user: member,
      paid: expenseRow?.paid || 0,
      share: summary.share,
      net: expenseRow?.net || 0,
      remaining: remaining?.net || 0,
      settledPaid,
      settledReceived,
    };
  });

  const hasPending = settlements.some((s) => s.status === SETTLEMENT_STATUS.PENDING);
  const hasDues = remainingNets.some((n) => Math.abs(n.net) > 0.01);

  return {
    group,
    expenses,
    settlements,
    summary: {
      total: summary.total,
      share: summary.share,
      memberCount: memberIds.length,
    },
    balances,
    canDelete: !hasPending && !hasDues,
  };
}

async function addMember({ groupId, userId, identifier }) {
  const group = await Group.findById(groupId);
  if (!group) throw new ApiError(404, 'Group not found');
  if (!group.createdBy.equals(userId)) {
    throw new ApiError(403, 'Only the group creator can add members');
  }

  const user = await findRegisteredUser(identifier.trim());
  if (group.members.some((m) => m.equals(user._id))) {
    throw new ApiError(409, 'That user is already in the group');
  }

  const hasExpenses = await Expense.exists({ group: groupId });
  if (hasExpenses) {
    throw new ApiError(400, 'Cannot add members after expenses have been recorded');
  }

  group.members.push(user._id);
  await group.save();
  return getGroupDetail(groupId, userId);
}

async function addExpense({ groupId, userId, amount, description, paidBy }) {
  const group = await Group.findById(groupId);
  if (!group) throw new ApiError(404, 'Group not found');
  if (!isMember(group, userId)) {
    throw new ApiError(403, 'You are not a member of this group');
  }
  if (group.members.length < 2) {
    throw new ApiError(400, 'A group needs at least two members before adding expenses');
  }

  const payerId = paidBy || userId;
  if (!isMember(group, payerId)) {
    throw new ApiError(400, 'The payer must be a group member');
  }

  await Expense.create({
    group: groupId,
    paidBy: payerId,
    amount: Number(amount),
    description: description || '',
    createdBy: userId,
  });

  await rebuildPendingSettlements(groupId);
  return getGroupDetail(groupId, userId);
}

async function removeExpense({ groupId, userId, expenseId }) {
  const group = await Group.findById(groupId);
  if (!group) throw new ApiError(404, 'Group not found');
  if (!isMember(group, userId)) {
    throw new ApiError(403, 'You are not a member of this group');
  }

  const expense = await Expense.findOne({ _id: expenseId, group: groupId });
  if (!expense) throw new ApiError(404, 'Expense not found');

  const canDelete = expense.createdBy.equals(userId) || group.createdBy.equals(userId);
  if (!canDelete) {
    throw new ApiError(403, 'You can only remove expenses you added');
  }

  const hasPaid = await Settlement.exists({
    group: groupId,
    status: SETTLEMENT_STATUS.PAID,
  });
  if (hasPaid) {
    throw new ApiError(400, 'Cannot remove expenses after a settlement has been paid');
  }

  await expense.deleteOne();
  await rebuildPendingSettlements(groupId);
  return getGroupDetail(groupId, userId);
}

async function paySettlement({ groupId, userId, settlementId, password }) {
  const settlement = await Settlement.findOne({ _id: settlementId, group: groupId })
    .populate('from')
    .populate('to');

  if (!settlement) throw new ApiError(404, 'Settlement request not found');
  if (settlement.status !== SETTLEMENT_STATUS.PENDING) {
    throw new ApiError(400, 'This settlement is no longer pending');
  }
  if (!settlement.to._id.equals(userId)) {
    throw new ApiError(403, 'Only the member who owes this amount can pay it');
  }

  const group = await Group.findById(groupId);
  const txn = await transactionService.sendMoney({
    senderId: userId,
    recipient: settlement.from.email,
    amount: settlement.amount,
    description: `Group settlement · ${group.name}`,
    password,
    idempotencyKey: `group-${settlement._id}`,
  });

  settlement.status = SETTLEMENT_STATUS.PAID;
  settlement.transaction = txn._id;
  await settlement.save();

  await notificationService.createNotification({
    userId: settlement.from._id,
    type: NOTIFICATION_TYPE.GROUP_SETTLED,
    message: `${settlement.to.name} paid you ${settlement.amount.toLocaleString()} BDT for "${group.name}".`,
    metadata: { groupId: String(groupId), transactionId: txn.transactionId },
  });

  await rebuildPendingSettlements(groupId);
  return getGroupDetail(groupId, userId);
}

async function deleteGroup({ groupId, userId }) {
  const detail = await getGroupDetail(groupId, userId);
  if (!detail.canDelete) {
    throw new ApiError(
      400,
      'This group can only be deleted when nobody owes anyone and no payment requests are open'
    );
  }

  await Expense.deleteMany({ group: groupId });
  await Settlement.deleteMany({ group: groupId });
  await Group.deleteOne({ _id: groupId });
}

module.exports = {
  createGroup,
  listGroups,
  getGroupDetail,
  addMember,
  addExpense,
  removeExpense,
  paySettlement,
  deleteGroup,
};
