const authService = require('../services/auth.service');
const twoFactorService = require('../services/twoFactor.service');
const asyncHandler = require('../utils/asyncHandler');

const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  res.status(201).json({ success: true, message: 'Account created', data: result });
});

const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  res.json({ success: true, message: 'Login successful', data: result });
});

const me = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { user: req.user.toSafeObject() } });
});

const updateProfile = asyncHandler(async (req, res) => {
  const user = await authService.updateProfile(req.user._id, req.body);
  res.json({ success: true, message: 'Profile updated', data: { user } });
});

const changePassword = asyncHandler(async (req, res) => {
  await authService.changePassword(req.user._id, req.body);
  res.json({ success: true, message: 'Password updated' });
});

const setupTwoFactor = asyncHandler(async (req, res) => {
  const data = await twoFactorService.setupTwoFactor(req.user._id);
  res.json({ success: true, data });
});

module.exports = { register, login, me, updateProfile, changePassword, setupTwoFactor };
