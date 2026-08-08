// ─────────────────────────────────────────────────
// middleware/upload.js
// Configuración de multer para subir avatares de usuario a disco local
// ─────────────────────────────────────────────────
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const AVATARS_DIR = path.join(__dirname, '..', 'uploads', 'avatars');
fs.mkdirSync(AVATARS_DIR, { recursive: true });

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, AVATARS_DIR),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
        cb(null, `${req.user._id}-${Date.now()}${ext}`);
    },
});

const fileFilter = (req, file, cb) => {
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
        return cb(new Error('Formato de imagen no soportado (usa JPG, PNG, WEBP o GIF)'));
    }
    cb(null, true);
};

const uploadAvatar = multer({
    storage,
    fileFilter,
    limits: { fileSize: 3 * 1024 * 1024 }, // 3MB
});

module.exports = { uploadAvatar, AVATARS_DIR };
