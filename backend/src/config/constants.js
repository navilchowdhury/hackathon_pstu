/**
 * Domain constants for wallet operations, risk scoring, and roles.
 * Keep magic numbers out of service logic.
 */
module.exports = {
  ROLES: {
    USER: 'user',
    ADMIN: 'admin',
  },

  TRANSACTION_STATUS: {
    PENDING: 'PENDING',
    SUCCESS: 'SUCCESS',
    FAILED: 'FAILED',
    REVERSED: 'REVERSED',
  },

  RISK_LEVEL: {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
  },

  NOTIFICATION_TYPE: {
    TRANSFER_SENT: 'TRANSFER_SENT',
    TRANSFER_RECEIVED: 'TRANSFER_RECEIVED',
    TRANSFER_FAILED: 'TRANSFER_FAILED',
    TRANSFER_REVERSED: 'TRANSFER_REVERSED',
    SECURITY_WARNING: 'SECURITY_WARNING',
    GROUP_REQUEST: 'GROUP_REQUEST',
    GROUP_SETTLED: 'GROUP_SETTLED',
    SYSTEM: 'SYSTEM',
  },

  LOG_ACTION: {
    CREATED: 'CREATED',
    COMPLETED: 'COMPLETED',
    FAILED: 'FAILED',
    REVERSED: 'REVERSED',
  },

  /** Default starting balance for every new wallet (BDT). */
  INITIAL_BALANCE: Number(process.env.INITIAL_BALANCE) || 100000,

  /** Maximum successful outbound transfers per calendar day (BDT). */
  DAILY_TRANSFER_LIMIT: Number(process.env.DAILY_TRANSFER_LIMIT) || 50000,

  /** Amount that contributes a large bump to the fraud score. */
  HIGH_AMOUNT_THRESHOLD: Number(process.env.HIGH_AMOUNT_THRESHOLD) || 50000,

  WALLET_ID_PREFIX: 'SP',
  TXN_ID_PREFIX: 'TXN',

  SETTLEMENT_STATUS: {
    PENDING: 'PENDING',
    PAID: 'PAID',
    CANCELLED: 'CANCELLED',
  },
};
