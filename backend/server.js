require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const connectDB  = require('./config/db');

const authRoutes     = require('./routes/auth');
const courseRoutes   = require('./routes/courses');
const videoRoutes    = require('./routes/videos');
const commentRoutes  = require('./routes/comments');
const progressRoutes = require('./routes/progress');
const adminRoutes    = require('./routes/admin');

const app = express();

// ── Conectar base de datos ────────────────────────
connectDB();

// ── Middlewares globales ──────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// ── Rutas ─────────────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/courses',  courseRoutes);
app.use('/api/videos',   videoRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/admin',    adminRoutes);

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
