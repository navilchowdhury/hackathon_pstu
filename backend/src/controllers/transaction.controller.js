const transactionService = require('../services/transaction.service');
const asyncHandler = require('../utils/asyncHandler');
const { ROLES } = require('../config/constants');

const sendMoney = asyncHandler(async (req, res) => {
  const txn = await transactionService.sendMoney({
    senderId: req.user._id,
    recipient: req.body.recipient,
    amount: req.body.amount,
    description: req.body.description,
    password: req.body.password,
    twoFactorToken: req.body.twoFactorToken,
    requireTwoFactor: true,
    idempotencyKey: req.body.idempotencyKey || req.get('Idempotency-Key'),
  });

  res.status(201).json({
    success: true,
    message: 'Transfer completed',
    data: { transaction: txn },
  });
});

const list = asyncHandler(async (req, res) => {
  const result = await transactionService.listTransactions(req.user._id, req.query);
  res.json({ success: true, data: result });
});

const getOne = asyncHandler(async (req, res) => {
  const isAdmin = req.user.role === ROLES.ADMIN;
  const data = await transactionService.getTransaction(req.user._id, req.params.id, isAdmin);
  res.json({ success: true, data });
});

const reverse = asyncHandler(async (req, res) => {
  const transaction = await transactionService.reverseTransaction({
    adminId: req.user._id,
    transactionRef: req.params.id,
  });
  res.json({ success: true, message: 'Transaction reversed', data: { transaction } });
});

module.exports = { sendMoney, list, getOne, reverse };
