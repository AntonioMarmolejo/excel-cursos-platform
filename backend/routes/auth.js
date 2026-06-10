// ─────────────────────────────────────────────────
// routes/auth.js
// ─────────────────────────────────────────────────
const express  = require('express');
const router   = express.Router();
const ctrl     = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register',                ctrl.register);
router.post('/login',                   ctrl.login);
router.get('/me',         protect,      ctrl.getMe);
router.get('/verify/:token',            ctrl.verifyEmail);
router.post('/forgot-password',         ctrl.forgotPassword);
router.post('/reset-password/:token',   ctrl.resetPassword);

module.exports = router;
