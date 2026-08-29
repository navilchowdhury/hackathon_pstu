const express = require('express');
const notificationController = require('../controllers/notification.controller');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.get('/', notificationController.list);
router.put('/read/all', notificationController.markAll);
router.put('/read/:id', notificationController.markRead);

module.exports = router;
