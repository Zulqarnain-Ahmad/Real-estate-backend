const express = require('express');
const { register, login, logout, refreshAccessToken, getMe } = require('../controllers/authController');
const { validateRegister, validateLogin } = require('../middleware/validators/authValidators');
const { authLimiter } = require('../middleware/rateLimiters');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', authLimiter, validateRegister, register);
router.post('/login', authLimiter, validateLogin, login);
router.post('/logout', logout);
router.post('/refresh', refreshAccessToken);
router.get('/me', protect, getMe);

module.exports = router;