const express = require('express');
const rateLimit = require('express-rate-limit');
const transactionController = require('../controllers/transaction.controller');
const { sendMoneyRules } = require('../validators/transaction.validators');
const { validate } = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');

const router = express.Router();

const sendLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: { success: false, message: 'Too many transfer attempts. Please wait a moment.' },
});

router.use(protect);
router.post('/send', sendLimiter, sendMoneyRules, validate, transactionController.sendMoney);
router.get('/', transactionController.list);
router.get('/:id', transactionController.getOne);
router.put('/reverse/:id', requireAdmin, transactionController.reverse);

module.exports = router;
