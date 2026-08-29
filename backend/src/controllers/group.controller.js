const groupService = require('../services/group.service');
const asyncHandler = require('../utils/asyncHandler');

const create = asyncHandler(async (req, res) => {
  const group = await groupService.createGroup({
    userId: req.user._id,
    name: req.body.name,
    members: req.body.members || [],
  });
  res.status(201).json({ success: true, message: 'Group created', data: { group } });
});

const list = asyncHandler(async (req, res) => {
  const items = await groupService.listGroups(req.user._id);
  res.json({ success: true, data: { items } });
});

const getOne = asyncHandler(async (req, res) => {
  const data = await groupService.getGroupDetail(req.params.id, req.user._id);
  res.json({ success: true, data });
});

const addMember = asyncHandler(async (req, res) => {
  const data = await groupService.addMember({
    groupId: req.params.id,
    userId: req.user._id,
    identifier: req.body.identifier,
  });
  res.json({ success: true, message: 'Member added', data });
});

const addExpense = asyncHandler(async (req, res) => {
  const data = await groupService.addExpense({
    groupId: req.params.id,
    userId: req.user._id,
    amount: req.body.amount,
    description: req.body.description,
    paidBy: req.body.paidBy,
  });
  res.status(201).json({ success: true, message: 'Expense added', data });
});

const removeExpense = asyncHandler(async (req, res) => {
  const data = await groupService.removeExpense({
    groupId: req.params.id,
    userId: req.user._id,
    expenseId: req.params.expenseId,
  });
  res.json({ success: true, message: 'Expense removed', data });
});

const pay = asyncHandler(async (req, res) => {
  const data = await groupService.paySettlement({
    groupId: req.params.id,
    userId: req.user._id,
    settlementId: req.params.settlementId,
    password: req.body.password,
  });
  res.json({ success: true, message: 'Settlement paid from your wallet', data });
});

const remove = asyncHandler(async (req, res) => {
  await groupService.deleteGroup({
    groupId: req.params.id,
    userId: req.user._id,
  });
  res.json({ success: true, message: 'Group deleted' });
});

module.exports = { create, list, getOne, addMember, addExpense, removeExpense, pay, remove };
