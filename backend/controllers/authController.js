const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/mailer');

const signToken = (id) =>
    jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// ── POST /api/auth/register ───────────────────────
exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password)
            return res.status(400).json({ success: false, message: 'Todos los campos son requeridos' });

        const exists = await User.findOne({ email });
        if (exists)
            return res.status(400).json({ success: false, message: 'El correo ya está registrado' });

        const verificationToken = crypto.randomBytes(32).toString('hex');

        const user = await User.create({ name, email, password, verificationToken });

        // Enviar email de verificación (silencioso si falla en dev)
        try { await sendVerificationEmail(user.email, user.name, verificationToken); } catch { }

        const token = signToken(user._id);
        res.status(201).json({ success: true, token, user });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ── POST /api/auth/login ──────────────────────────
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password)
            return res.status(400).json({ success: false, message: 'Email y contraseña requeridos' });

        const user = await User.findOne({ email });
        if (!user || !(await user.comparePassword(password)))
            return res.status(401).json({ success: false, message: 'Credenciales incorrectas' });

        user.lastLogin = new Date();
        await user.save({ validateBeforeSave: false });

        const token = signToken(user._id);
        res.json({ success: true, token, user });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ── GET /api/auth/me ──────────────────────────────
exports.getMe = async (req, res) => {
    res.json({ success: true, user: req.user });
};

// ── PUT /api/auth/me/avatar ───────────────────────
exports.uploadAvatar = async (req, res) => {
    try {
        if (!req.file)
            return res.status(400).json({ success: false, message: 'No se recibió ninguna imagen' });

        const user = await User.findById(req.user._id);

        // Borrar el avatar anterior si existía (silencioso si falla)
        if (user.avatar) {
            const oldPath = path.join(__dirname, '..', user.avatar);
            fs.unlink(oldPath, () => { });
        }

        user.avatar = `/uploads/avatars/${req.file.filename}`;
        await user.save({ validateBeforeSave: false });

        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ── PUT /api/auth/me/password ─────────────────────
exports.updatePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword)
            return res.status(400).json({ success: false, message: 'Completa ambos campos' });
        if (newPassword.length < 6)
            return res.status(400).json({ success: false, message: 'La nueva contraseña debe tener al menos 6 caracteres' });

        const user = await User.findById(req.user._id);
        const matches = await user.comparePassword(currentPassword);
        if (!matches)
            return res.status(401).json({ success: false, message: 'La contraseña actual es incorrecta' });

        user.password = newPassword; // el hook pre('save') la vuelve a hashear
        await user.save();

        res.json({ success: true, message: 'Contraseña actualizada correctamente' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ── GET /api/auth/verify/:token ───────────────────
exports.verifyEmail = async (req, res) => {
    try {
        const user = await User.findOne({ verificationToken: req.params.token });
        if (!user)
            return res.status(400).json({ success: false, message: 'Token inválido' });

        user.isVerified = true;
        user.verificationToken = undefined;
        await user.save({ validateBeforeSave: false });

        res.json({ success: true, message: 'Email verificado correctamente' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ── POST /api/auth/forgot-password ───────────────
exports.forgotPassword = async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (!user) return res.json({ success: true, message: 'Si el correo existe recibirás un enlace' });

        const token = crypto.randomBytes(32).toString('hex');
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hora
        await user.save({ validateBeforeSave: false });

        try { await sendPasswordResetEmail(user.email, user.name, token); } catch { }
        res.json({ success: true, message: 'Si el correo existe recibirás un enlace' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ── POST /api/auth/reset-password/:token ─────────
exports.resetPassword = async (req, res) => {
    try {
        const user = await User.findOne({
            resetPasswordToken: req.params.token,
            resetPasswordExpires: { $gt: Date.now() },
        });
        if (!user)
            return res.status(400).json({ success: false, message: 'Token inválido o expirado' });

        user.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.json({ success: true, message: 'Contraseña actualizada correctamente' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
