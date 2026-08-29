const express = require('express');
const adminController = require('../controllers/admin.controller');
const { protect } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');

const router = express.Router();

router.use(protect, requireAdmin);
router.get('/users', adminController.users);
router.get('/statistics', adminController.statistics);
router.get('/transactions', adminController.transactions);

module.exports = router;
