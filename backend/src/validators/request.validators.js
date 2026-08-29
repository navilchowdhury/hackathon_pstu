const { body } = require('express-validator');

const createRequestRules = [
  body('recipient').trim().notEmpty().withMessage('Payer email or wallet ID is required'),
  body('amount').isFloat({ gt: 0 }).withMessage('Amount must be greater than 0'),
  body('description').optional().trim().isLength({ max: 240 }),
];

const payRequestRules = [
  body('password').notEmpty().withMessage('Password is required to pay this request'),
];

module.exports = { createRequestRules, payRequestRules };
