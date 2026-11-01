const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/mailer');

const googleClient = new OAuth2Client();

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

// ── GET /api/auth/google/config ───────────────────
// El Client ID de Google es público; se expone para no duplicarlo en el frontend
exports.googleConfig = (req, res) => {
    res.json({ success: true, clientId: process.env.GOOGLE_CLIENT_ID || null });
};

// ── POST /api/auth/google ─────────────────────────
// Recibe el ID token que entrega el botón de Google, lo verifica y crea o
// vincula la cuenta por email.
exports.googleLogin = async (req, res) => {
    try {
        const clientId = process.env.GOOGLE_CLIENT_ID;
        if (!clientId)
            return res.status(500).json({ success: false, message: 'El inicio de sesión con Google no está configurado' });
        if (!req.body.credential)
            return res.status(400).json({ success: false, message: 'Falta la credencial de Google' });

        let payload;
        try {
            const ticket = await googleClient.verifyIdToken({ idToken: req.body.credential, audience: clientId });
            payload = ticket.getPayload();
        } catch {
            return res.status(401).json({ success: false, message: 'No se pudo verificar tu cuenta de Google' });
        }
        // Solo se confía en el email si Google lo verificó (evita tomar cuentas ajenas)
        if (!payload?.email || !payload.email_verified)
            return res.status(401).json({ success: false, message: 'Tu correo de Google no está verificado' });

        const email = payload.email.toLowerCase();
        let user = await User.findOne({ $or: [{ googleId: payload.sub }, { email }] });

        if (!user) {
            user = await User.create({
                name: payload.name || email.split('@')[0],
                email,
                // Contraseña aleatoria: la cuenta entra con Google (puede crear una con "Olvidé mi contraseña")
                password: crypto.randomBytes(32).toString('hex'),
                googleId: payload.sub,
                avatar: payload.picture,
                isVerified: true,
            });
        } else {
            // Cuenta existente con el mismo email: se vincula a Google
            user.googleId = user.googleId || payload.sub;
            user.isVerified = true;
            user.verificationToken = undefined;
            if (!user.avatar && payload.picture) user.avatar = payload.picture;
        }

        user.lastLogin = new Date();
        await user.save({ validateBeforeSave: false });

        const token = signToken(user._id);
        res.json({ success: true, token, user });
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
