const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');

/**
 * Creates (or rotates) a TOTP secret for Google Authenticator and returns a scanable QR data URL.
 */
async function setupTwoFactor(userId) {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found');

  const secret = speakeasy.generateSecret({
    name: `SecurePay (${user.email})`,
    issuer: 'SecurePay',
    length: 20,
  });

  user.twoFactorSecret = secret.base32;
  user.isTwoFactorEnabled = true;
  await user.save();

  const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

  return {
    qrCodeUrl,
    secret: secret.base32,
  };
}

function verifyTwoFactorToken(secret, twoFactorToken) {
  if (!secret || !twoFactorToken) return false;

  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token: String(twoFactorToken).replace(/\s/g, ''),
    window: 1,
  });
}

module.exports = { setupTwoFactor, verifyTwoFactorToken };
