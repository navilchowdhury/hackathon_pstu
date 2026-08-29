const { body } = require('express-validator');

const createGroupRules = [
  body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Group name must be 2–80 characters'),
  body('members').optional().isArray().withMessage('Members must be an array of emails or wallet IDs'),
];

const addMemberRules = [
  body('identifier').trim().notEmpty().withMessage('Member email or wallet ID is required'),
];

const addExpenseRules = [
  body('amount').isFloat({ gt: 0 }).withMessage('Amount must be greater than 0'),
  body('description').optional().trim().isLength({ max: 240 }),
  body('paidBy').optional().isMongoId(),
];

const paySettlementRules = [
  body('password').notEmpty().withMessage('Password is required to settle from your wallet'),
];

module.exports = { createGroupRules, addMemberRules, addExpenseRules, paySettlementRules };
