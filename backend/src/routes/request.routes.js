const express = require('express');
const requestController = require('../controllers/request.controller');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { createRequestRules, payRequestRules } = require('../validators/request.validators');

const router = express.Router();

router.use(protect);
router.post('/', createRequestRules, validate, requestController.create);
router.get('/', requestController.list);
router.post('/:id/pay', payRequestRules, validate, requestController.pay);
router.post('/:id/decline', requestController.decline);
router.post('/:id/cancel', requestController.cancel);

module.exports = router;
