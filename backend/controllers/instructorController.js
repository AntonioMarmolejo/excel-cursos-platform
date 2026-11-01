const mongoose = require('mongoose');
const User = require('../models/User');
const Course = require('../models/Course');

const APPLICATION_FIELDS = ['headline', 'bio', 'expertise', 'website', 'sampleUrl'];

// ── POST /api/instructors/apply ───────────────────
// Un usuario envía (o reenvía tras un rechazo) su solicitud para ser instructor
exports.apply = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (user.role !== 'user')
            return res.status(400).json({ success: false, message: 'Tu cuenta ya tiene permisos de instructor' });
        if (user.instructorProfile?.status === 'pending')
            return res.status(400).json({ success: false, message: 'Ya tienes una solicitud en revisión' });

        const { headline, bio, expertise } = req.body;
        if (!headline?.trim() || !bio?.trim() || !expertise?.trim())
            return res.status(400).json({ success: false, message: 'Completa tu título, biografía y qué quieres enseñar' });

        for (const field of APPLICATION_FIELDS) {
            if (req.body[field] !== undefined) user.instructorProfile[field] = String(req.body[field]).trim();
        }
        user.instructorProfile.status = 'pending';
        user.instructorProfile.appliedAt = new Date();
        user.instructorProfile.rejectionReason = '';

        await user.save({ validateBeforeSave: false });
        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ── PUT /api/instructors/me (instructor) ──────────
// Editar el perfil público (título y biografía)
exports.updateProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        for (const field of ['headline', 'bio', 'website']) {
            if (req.body[field] !== undefined) user.instructorProfile[field] = String(req.body[field]).trim();
        }
        await user.save({ validateBeforeSave: false });
        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ── GET /api/instructors/:id ──────────────────────
// Perfil público del instructor + sus cursos publicados
exports.getPublicProfile = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id))
            return res.status(404).json({ success: false, message: 'Instructor no encontrado' });

        const instructor = await User.findOne({ _id: req.params.id, role: { $in: ['instructor', 'admin'] } })
            .select('name avatar instructorProfile.headline instructorProfile.bio instructorProfile.website createdAt');
        if (!instructor)
            return res.status(404).json({ success: false, message: 'Instructor no encontrado' });

        const courses = await Course.find({ instructor: instructor._id, isPublished: true }).sort('order');
        res.json({ success: true, instructor, courses });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
