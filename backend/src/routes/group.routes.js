const express = require('express');
const groupController = require('../controllers/group.controller');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const {
  createGroupRules,
  addMemberRules,
  addExpenseRules,
  paySettlementRules,
} = require('../validators/group.validators');

const router = express.Router();

router.use(protect);
router.post('/', createGroupRules, validate, groupController.create);
router.get('/', groupController.list);
router.get('/:id', groupController.getOne);
router.post('/:id/members', addMemberRules, validate, groupController.addMember);
router.post('/:id/expenses', addExpenseRules, validate, groupController.addExpense);
router.delete('/:id/expenses/:expenseId', groupController.removeExpense);
router.delete('/:id', groupController.remove);
router.post(
  '/:id/settlements/:settlementId/pay',
  paySettlementRules,
  validate,
  groupController.pay
);

module.exports = router;
