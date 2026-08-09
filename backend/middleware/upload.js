// ─────────────────────────────────────────────────
// middleware/upload.js
// Configuración de multer para subir imágenes a disco local
// ─────────────────────────────────────────────────
const fs     = require('fs');
const path   = require('path');
const multer = require('multer');

const UPLOADS_ROOT  = path.join(__dirname, '..', 'uploads');
const ALLOWED_TYPES  = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// Crea un uploader de imágenes hacia uploads/<subdir>/, nombrando cada
// archivo con el id devuelto por `getId(req)` + timestamp.
function createImageUploader(subdir, getId, maxSizeMB = 3) {
  const dir = path.join(UPLOADS_ROOT, subdir);
  fs.mkdirSync(dir, { recursive: true });

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, dir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
      cb(null, `${getId(req)}-${Date.now()}${ext}`);
    },
  });

  const fileFilter = (req, file, cb) => {
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      return cb(new Error('Formato de imagen no soportado (usa JPG, PNG, WEBP o GIF)'));
    }
    cb(null, true);
  };

  return multer({ storage, fileFilter, limits: { fileSize: maxSizeMB * 1024 * 1024 } });
}

// Avatares de usuario: uploads/avatars/<userId>-<timestamp>.ext
const uploadAvatar = createImageUploader('avatars', (req) => req.user._id);

// Portadas de curso: uploads/courses/<courseId>-<timestamp>.ext
const uploadCourseThumbnail = createImageUploader('courses', (req) => req.params.id);

module.exports = { uploadAvatar, uploadCourseThumbnail };
