const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/courseController');
const { protect, adminOnly } = require('../middleware/auth');

// Público (con usuario opcional para saber si tiene acceso)
router.get('/', (req, res, next) => { require('../middleware/auth').protect(req, res, () => next()); next; }, ctrl.getAll);
router.get('/:slug', (req, res, next) => {
    // Intentar autenticar sin obligar (para que el usuario vea qué está bloqueado)
    const { protect } = require('../middleware/auth');
    const jwt = require('jsonwebtoken');
    const User = require('../models/User');
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            User.findById(decoded.id).then(user => {
                req.user = user;
                next();
            }).catch(() => next());
        } catch { next(); }
    } else { next(); }
}, ctrl.getOne);

// Admin
router.post('/', protect, adminOnly, ctrl.create);
router.put('/:id', protect, adminOnly, ctrl.update);
router.delete('/:id', protect, adminOnly, ctrl.remove);

module.exports = router;
