// ─────────────────────────────────────────────────
// routes/auth.js
// ─────────────────────────────────────────────────
const express  = require('express');
const router   = express.Router();
const ctrl     = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { uploadAvatar } = require('../middleware/upload');

router.post('/register',                ctrl.register);
router.post('/login',                   ctrl.login);
router.get('/me',         protect,      ctrl.getMe);
router.put('/me/avatar',  protect,      uploadAvatar.single('avatar'), ctrl.uploadAvatar);
router.put('/me/password', protect,     ctrl.updatePassword);
router.get('/verify/:token',            ctrl.verifyEmail);
router.post('/forgot-password',         ctrl.forgotPassword);
router.post('/reset-password/:token',   ctrl.resetPassword);

module.exports = router;
