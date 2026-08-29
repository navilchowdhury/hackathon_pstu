const requestService = require('../services/request.service');
const asyncHandler = require('../utils/asyncHandler');

const create = asyncHandler(async (req, res) => {
  const request = await requestService.createRequest({
    userId: req.user._id,
    recipient: req.body.recipient,
    amount: req.body.amount,
    description: req.body.description,
  });
  res.status(201).json({ success: true, message: 'Money request sent', data: { request } });
});

const list = asyncHandler(async (req, res) => {
  const data = await requestService.listRequests(req.user._id);
  res.json({ success: true, data });
});

const pay = asyncHandler(async (req, res) => {
  const request = await requestService.payRequest({
    userId: req.user._id,
    requestId: req.params.id,
    password: req.body.password,
  });
  res.json({ success: true, message: 'Request paid from your wallet', data: { request } });
});

const decline = asyncHandler(async (req, res) => {
  const request = await requestService.declineRequest({
    userId: req.user._id,
    requestId: req.params.id,
  });
  res.json({ success: true, message: 'Request declined', data: { request } });
});

const cancel = asyncHandler(async (req, res) => {
  const request = await requestService.cancelRequest({
    userId: req.user._id,
    requestId: req.params.id,
  });
  res.json({ success: true, message: 'Request cancelled', data: { request } });
});

module.exports = { create, list, pay, decline, cancel };
