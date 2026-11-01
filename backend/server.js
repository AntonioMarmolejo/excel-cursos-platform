require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const authRoutes = require('./routes/auth');
const courseRoutes = require('./routes/courses');
const videoRoutes = require('./routes/videos');
const commentRoutes = require('./routes/comments');
const progressRoutes = require('./routes/progress');
const adminRoutes = require('./routes/admin');
const instructorRoutes = require('./routes/instructors');

const app = express();

// ── Conectar base de datos ────────────────────────
connectDB();

// ── Middlewares globales ──────────────────────────
// CLIENT_URL admite varios orígenes separados por coma (ej. dominio con y sin www).
// En desarrollo se acepta además cualquier puerto de localhost, porque Vite cambia
// de puerto (5174, 5175…) cuando el 5173 está ocupado por otro proyecto.
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',').map(o => o.trim()).filter(Boolean);
const isDevLocalhost = (origin) =>
    process.env.NODE_ENV !== 'production' && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);

app.use(cors({
    origin: (origin, cb) => {
        // Peticiones sin Origin (curl, Postman, mismo origen) no pasan por CORS
        if (!origin || allowedOrigins.includes(origin) || isDevLocalhost(origin)) return cb(null, true);
        cb(null, false);
    },
    credentials: true,
}));
app.use(express.json());

// ── Archivos subidos (avatares, etc.) ─────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Rutas ─────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/instructors', instructorRoutes);

// ── Health check ──────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Manejo de errores global ──────────────────────
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Error interno del servidor',
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✅ Servidor corriendo en puerto ${PORT} [${process.env.NODE_ENV}]`);
});
