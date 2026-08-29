const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { TRANSACTION_STATUS, RISK_LEVEL } = require('../config/constants');

async function listUsers({ search, page = 1, limit = 20 }) {
  const filter = { role: 'user' };
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { walletId: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    User.countDocuments(filter),
  ]);

  return {
    items: items.map((u) => u.toSafeObject()),
    total,
    page: Number(page),
    limit: Number(limit),
  };
}

async function listAllTransactions({ status, riskLevel, search, page = 1, limit = 20 }) {
  const filter = {};
  if (status) filter.status = status.toUpperCase();
  if (riskLevel) filter.riskLevel = riskLevel.toUpperCase();
  if (search) filter.transactionId = { $regex: search.trim(), $options: 'i' };

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

async function getStatistics() {
  const [userCount, txnStats, riskStats, monthly] = await Promise.all([
    User.countDocuments({ role: 'user' }),
    Transaction.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          volume: { $sum: '$amount' },
        },
      },
    ]),
    Transaction.aggregate([
      {
        $group: {
          _id: '$riskLevel',
          count: { $sum: 1 },
          volume: { $sum: '$amount' },
        },
      },
    ]),
    Transaction.aggregate([
      {
        $match: { status: TRANSACTION_STATUS.SUCCESS },
      },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          volume: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 },
    ]),
  ]);

  const byStatus = txnStats.reduce((acc, row) => {
    acc[row._id] = { count: row.count, volume: row.volume };
    return acc;
  }, {});

  const success = byStatus[TRANSACTION_STATUS.SUCCESS] || { count: 0, volume: 0 };
  const highRisk = riskStats.find((r) => r._id === RISK_LEVEL.HIGH);

  return {
    totalUsers: userCount,
    totalTransactions: txnStats.reduce((sum, r) => sum + r.count, 0),
    totalMoneyMovement: success.volume,
    successfulCount: success.count,
    failedCount: byStatus[TRANSACTION_STATUS.FAILED]?.count || 0,
    reversedCount: byStatus[TRANSACTION_STATUS.REVERSED]?.count || 0,
    suspiciousCount: highRisk?.count || 0,
    riskBreakdown: riskStats,
    monthly,
  };
}

module.exports = { listUsers, listAllTransactions, getStatistics };
