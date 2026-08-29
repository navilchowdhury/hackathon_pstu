const crypto = require('crypto');
const { WALLET_ID_PREFIX, TXN_ID_PREFIX } = require('../config/constants');

function randomUpper(length) {
  return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length).toUpperCase();
}

function generateWalletId() {
  return `${WALLET_ID_PREFIX}-${randomUpper(10)}`;
}

function generateTransactionId() {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `${TXN_ID_PREFIX}-${stamp}-${randomUpper(8)}`;
}

module.exports = { generateWalletId, generateTransactionId };
