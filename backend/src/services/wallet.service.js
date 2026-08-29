const mongoose = require('mongoose');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { TRANSACTION_STATUS } = require('../config/constants');
const ApiError = require('../utils/ApiError');

async function getWallet(userId) {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'Wallet not found');

  const [sentAgg, receivedAgg] = await Promise.all([
    Transaction.aggregate([
      { $match: { sender: user._id, status: TRANSACTION_STATUS.SUCCESS } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
    Transaction.aggregate([
      { $match: { receiver: user._id, status: TRANSACTION_STATUS.SUCCESS } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
  ]);

  return {
    walletId: user.walletId,
    balance: user.walletBalance,
    currency: 'BDT',
    totalSent: sentAgg[0]?.total || 0,
    totalReceived: receivedAgg[0]?.total || 0,
    sentCount: sentAgg[0]?.count || 0,
    receivedCount: receivedAgg[0]?.count || 0,
  };
}

async function getAnalytics(userId) {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const start = new Date();
  start.setMonth(start.getMonth() - 5);
  start.setDate(1);
  start.setHours(0, 0, 0, 0);

  const monthly = await Transaction.aggregate([
    {
      $match: {
        $or: [{ sender: userObjectId }, { receiver: userObjectId }],
        status: TRANSACTION_STATUS.SUCCESS,
        createdAt: { $gte: start },
      },
    },
    {
      $group: {
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        sent: {
          $sum: { $cond: [{ $eq: ['$sender', userObjectId] }, '$amount', 0] },
        },
        received: {
          $sum: { $cond: [{ $eq: ['$receiver', userObjectId] }, '$amount', 0] },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  const wallet = await getWallet(userId);

  return { wallet, monthly };
}

module.exports = { getWallet, getAnalytics };
