const walletService = require('../services/wallet.service');
const transactionService = require('../services/transaction.service');
const asyncHandler = require('../utils/asyncHandler');
const { DAILY_TRANSFER_LIMIT } = require('../config/constants');

const getWallet = asyncHandler(async (req, res) => {
  const [wallet, dailyUsed] = await Promise.all([
    walletService.getWallet(req.user._id),
    transactionService.getDailyOutboundTotal(req.user._id),
  ]);

  res.json({
    success: true,
    data: {
      ...wallet,
      dailyLimit: DAILY_TRANSFER_LIMIT,
      dailyUsed,
      dailyRemaining: Math.max(0, DAILY_TRANSFER_LIMIT - dailyUsed),
    },
  });
});

const getHistory = asyncHandler(async (req, res) => {
  const result = await transactionService.listTransactions(req.user._id, {
    ...req.query,
    limit: req.query.limit || 8,
  });
  res.json({ success: true, data: result });
});

const getAnalytics = asyncHandler(async (req, res) => {
  const data = await walletService.getAnalytics(req.user._id);
  res.json({ success: true, data });
});

module.exports = { getWallet, getHistory, getAnalytics };
