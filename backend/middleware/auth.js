const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ── Verificar token ───────────────────────────────
const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization?.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ success: false, message: 'No autorizado, token requerido' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select('-password');
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Usuario no encontrado' });
        }
        next();
    } catch {
        res.status(401).json({ success: false, message: 'Token inválido o expirado' });
    }
};

// ── Solo admins ───────────────────────────────────
const adminOnly = (req, res, next) => {
    if (req.user?.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Acceso restringido a administradores' });
    }
    next();
};

// ── Verificar acceso a un curso (suscripción o compra) ──
const requireCourseAccess = (req, res, next) => {
    const { courseId } = req.params;
    if (req.user.role === 'admin') return next();
    if (!req.user.hasCourseAccess(courseId)) {
        return res.status(403).json({
            success: false,
            message: 'Necesitas una suscripción activa o haber comprado este curso',
        });
    }
    next();
};

module.exports = { protect, adminOnly, requireCourseAccess };
