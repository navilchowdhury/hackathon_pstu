const jwt = require('jsonwebtoken');
const User = require('../models/User');
const env = require('../config/env');
const { INITIAL_BALANCE, ROLES, NOTIFICATION_TYPE } = require('../config/constants');
const ApiError = require('../utils/ApiError');
const notificationService = require('./notification.service');

function signToken(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
}

async function register({ name, email, password }) {
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw new ApiError(409, 'An account with this email already exists');
  }

  const user = await User.create({
    name,
    email,
    password,
    role: ROLES.USER,
    walletBalance: INITIAL_BALANCE,
  });

  await notificationService.createNotification({
    userId: user._id,
    type: NOTIFICATION_TYPE.SYSTEM,
    message: `Welcome to SecurePay. Your wallet ${user.walletId} is funded with ${INITIAL_BALANCE.toLocaleString()} BDT.`,
  });

  return {
    user: user.toSafeObject(),
    token: signToken(user),
  };
}

async function login({ email, password }) {
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const match = await user.comparePassword(password);
  if (!match) {
    throw new ApiError(401, 'Invalid email or password');
  }

  if (!user.isActive) {
    throw new ApiError(403, 'This account has been disabled');
  }

  return {
    user: user.toSafeObject(),
    token: signToken(user),
  };
}

async function updateProfile(userId, { name }) {
  const user = await User.findByIdAndUpdate(userId, { name }, { new: true, runValidators: true });
  if (!user) throw new ApiError(404, 'User not found');
  return user.toSafeObject();
}

async function changePassword(userId, { currentPassword, newPassword }) {
  const user = await User.findById(userId).select('+password');
  if (!user) throw new ApiError(404, 'User not found');

  const match = await user.comparePassword(currentPassword);
  if (!match) {
    throw new ApiError(400, 'Current password is incorrect');
  }

  user.password = newPassword;
  await user.save();
}

module.exports = { register, login, updateProfile, changePassword };
