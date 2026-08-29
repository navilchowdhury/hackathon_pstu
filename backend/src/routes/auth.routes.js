const express = require('express');
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/auth.controller');
const { registerRules, loginRules, updateProfileRules, changePasswordRules } = require('../validators/auth.validators');
const { validate } = require('../middleware/validate');
const { protect } = require('../middleware/auth');

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: { success: false, message: 'Too many authentication attempts. Try again later.' },
});

router.post('/register', authLimiter, registerRules, validate, authController.register);
router.post('/login', authLimiter, loginRules, validate, authController.login);
router.get('/me', protect, authController.me);
router.put('/profile', protect, updateProfileRules, validate, authController.updateProfile);
router.put('/password', protect, changePasswordRules, validate, authController.changePassword);
router.post('/setup-2fa', protect, authController.setupTwoFactor);

module.exports = router;
