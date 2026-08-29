const adminService = require('../services/admin.service');
const asyncHandler = require('../utils/asyncHandler');

const users = asyncHandler(async (req, res) => {
  const data = await adminService.listUsers(req.query);
  res.json({ success: true, data });
});

const statistics = asyncHandler(async (req, res) => {
  const data = await adminService.getStatistics();
  res.json({ success: true, data });
});

const transactions = asyncHandler(async (req, res) => {
  const data = await adminService.listAllTransactions(req.query);
  res.json({ success: true, data });
});

module.exports = { users, statistics, transactions };
