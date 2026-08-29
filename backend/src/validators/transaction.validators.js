const { body } = require('express-validator');

const sendMoneyRules = [
  body('recipient')
    .trim()
    .notEmpty()
    .withMessage('Receiver email or wallet ID is required'),
  body('amount')
    .isFloat({ gt: 0 })
    .withMessage('Amount must be greater than 0')
    .custom((value) => {
      const rounded = Math.round(Number(value) * 100) / 100;
      if (rounded !== Number(value)) {
        throw new Error('Amount supports up to 2 decimal places');
      }
      return true;
    }),
  body('description').optional().trim().isLength({ max: 240 }),
  body('password').notEmpty().withMessage('Password is required to confirm this transfer'),
  body('twoFactorToken').optional().isString(),
  body('idempotencyKey').optional().isString().isLength({ min: 8, max: 80 }),
];

module.exports = { sendMoneyRules };
