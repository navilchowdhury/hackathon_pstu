const express = require('express');
const walletController = require('../controllers/wallet.controller');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.get('/', walletController.getWallet);
router.get('/history', walletController.getHistory);
router.get('/analytics', walletController.getAnalytics);

module.exports = router;
