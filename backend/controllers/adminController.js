const User = require('../models/User');
const Course = require('../models/Course');
const Progress = require('../models/Progress');
const Comment = require('../models/Comment');

const { sendInstructorDecisionEmail, sendCourseReviewEmail } = require('../utils/mailer');

// Los correos de notificación no deben romper la acción del admin si el SMTP falla
const notify = (promise) => promise.catch(err => console.error('Error enviando correo:', err.message));

// ── GET /api/admin/courses ────────────────────────
// Todos los cursos incluyendo no publicados. Filtro opcional: ?reviewStatus=pending
exports.getAllCourses = async (req, res) => {
    try {
        const query = {};
        if (req.query.reviewStatus) query.reviewStatus = req.query.reviewStatus;
        const courses = await Course.find(query)
            .sort('order')
            .populate('instructor', 'name email');
        res.json({ success: true, courses });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ── PUT /api/admin/courses/:id/review ─────────────
// Aprobar (publica) o rechazar un curso enviado por un instructor
exports.reviewCourse = async (req, res) => {
    try {
        const { action, reason = '' } = req.body;
        if (!['approve', 'reject'].includes(action))
            return res.status(400).json({ success: false, message: 'Acción inválida' });

        const course = await Course.findById(req.params.id).populate('instructor', 'name email');
        if (!course) return res.status(404).json({ success: false, message: 'Curso no encontrado' });

        const approved = action === 'approve';
        course.reviewStatus = approved ? 'approved' : 'rejected';
        course.isPublished = approved;
        course.rejectionReason = approved ? '' : reason.trim();
        await course.save();

        if (course.instructor?.email)
            notify(sendCourseReviewEmail(course.instructor.email, course.instructor.name, course.title, approved, course.rejectionReason));

        res.json({ success: true, course });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ── GET /api/admin/instructor-applications ────────
// Solicitudes de instructor. Filtro: ?status=pending (por defecto)
exports.getInstructorApplications = async (req, res) => {
    try {
        const status = req.query.status || 'pending';
        const users = await User.find({ 'instructorProfile.status': status })
            .select('name email avatar instructorProfile createdAt')
            .sort('instructorProfile.appliedAt');
        res.json({ success: true, applications: users });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ── PUT /api/admin/instructor-applications/:id ────
exports.reviewInstructorApplication = async (req, res) => {
    try {
        const { action, reason = '' } = req.body;
        if (!['approve', 'reject'].includes(action))
            return res.status(400).json({ success: false, message: 'Acción inválida' });

        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        if (user.instructorProfile?.status !== 'pending')
            return res.status(400).json({ success: false, message: 'Esta solicitud no está pendiente' });

        const approved = action === 'approve';
        user.instructorProfile.status = approved ? 'approved' : 'rejected';
        user.instructorProfile.reviewedAt = new Date();
        user.instructorProfile.rejectionReason = approved ? '' : reason.trim();
        if (approved && user.role === 'user') user.role = 'instructor';
        await user.save({ validateBeforeSave: false });

        notify(sendInstructorDecisionEmail(user.email, user.name, approved, user.instructorProfile.rejectionReason));
        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ── PUT /api/admin/users/:id/access ──────────────
// Gestionar suscripción y acceso individual a cursos
exports.updateAccess = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });

        const { action, plan, status, endDate, courseId } = req.body;

        if (action === 'grant-course' && courseId) {
            const already = user.subscription.courseAccess.some(id => id.toString() === courseId);
            if (!already) user.subscription.courseAccess.push(courseId);
        } else if (action === 'revoke-course' && courseId) {
            user.subscription.courseAccess = user.subscription.courseAccess.filter(
                id => id.toString() !== courseId
            );
        } else if (action === 'set-subscription') {
            user.subscription.plan = plan;
            user.subscription.status = status || 'active';
            user.subscription.startDate = user.subscription.startDate || new Date();
            user.subscription.endDate = plan === 'lifetime' ? null : (endDate ? new Date(endDate) : null);
        } else if (action === 'cancel-subscription') {
            user.subscription.status = 'cancelled';
        }

        await user.save({ validateBeforeSave: false });
        const updated = await User.findById(user._id).select('-password');
        res.json({ success: true, user: updated });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ── PUT /api/admin/comments/:id/toggle ───────────
exports.toggleComment = async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.id);
        if (!comment) return res.status(404).json({ success: false, message: 'Comentario no encontrado' });
        comment.isHidden = !comment.isHidden;
        await comment.save();
        res.json({ success: true, comment });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ── GET /api/admin/stats ──────────────────────────
exports.getStats = async (req, res) => {
    try {
        const [totalUsers, activeSubscriptions, totalCourses, totalInstructors, pendingApplications, pendingCourses, recentComments] = await Promise.all([
            User.countDocuments({ role: { $in: ['user', 'instructor'] } }),
            User.countDocuments({ 'subscription.status': 'active' }),
            Course.countDocuments({ isPublished: true }),
            User.countDocuments({ role: 'instructor' }),
            User.countDocuments({ 'instructorProfile.status': 'pending' }),
            Course.countDocuments({ reviewStatus: 'pending' }),
            Comment.find({ isHidden: false }).sort('-createdAt').limit(5)
                .populate('user', 'name')
                .populate('video', 'title'),
        ]);

        // Nuevos usuarios últimos 30 días
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const newUsers = await User.countDocuments({
            role: { $in: ['user', 'instructor'] },
            createdAt: { $gte: thirtyDaysAgo },
        });

        // Distribución de planes
        const planDist = await User.aggregate([
            { $match: { 'subscription.status': 'active' } },
            { $group: { _id: '$subscription.plan', count: { $sum: 1 } } },
        ]);

        res.json({
            success: true,
            stats: {
                totalUsers,
                activeSubscriptions,
                totalCourses,
                totalInstructors,
                pendingApplications,
                pendingCourses,
                newUsersLast30Days: newUsers,
                planDistribution: planDist,
                recentComments,
            },
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ── GET /api/admin/users ──────────────────────────
exports.getUsers = async (req, res) => {
    try {
        const { page = 1, limit = 20, search = '' } = req.query;
        const query = { role: { $in: ['user', 'instructor'] } };
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ];
        }

        const [users, total] = await Promise.all([
            User.find(query)
                .select('name email role subscription createdAt lastLogin')
                .sort('-createdAt')
                .skip((page - 1) * limit)
                .limit(Number(limit)),
            User.countDocuments(query),
        ]);

        res.json({ success: true, users, total, pages: Math.ceil(total / limit) });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ── GET /api/admin/users/:id/progress ────────────
exports.getUserProgress = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('name email subscription');
        if (!user) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });

        const progress = await Progress.find({ user: req.params.id })
            .populate('course', 'title level slug');

        res.json({ success: true, user, progress });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ── GET /api/admin/comments ───────────────────────
exports.getComments = async (req, res) => {
    try {
        const { page = 1, limit = 20, hidden = false } = req.query;
        const comments = await Comment.find({ isHidden: hidden === 'true' })
            .populate('user', 'name email')
            .populate('video', 'title')
            .populate('course', 'title level')
            .sort('-createdAt')
            .skip((page - 1) * limit)
            .limit(Number(limit));

        const total = await Comment.countDocuments({ isHidden: hidden === 'true' });
        res.json({ success: true, comments, total });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ── POST /api/admin/create-admin ──────────────────
// Ruta protegida con secret para crear el primer admin
exports.createAdmin = async (req, res) => {
    try {
        if (req.body.secret !== process.env.ADMIN_SECRET)
            return res.status(403).json({ success: false, message: 'Secret incorrecto' });

        const { name, email, password } = req.body;
        const existing = await User.findOne({ email });
        if (existing) {
            existing.role = 'admin';
            await existing.save({ validateBeforeSave: false });
            return res.json({ success: true, message: 'Usuario promovido a admin' });
        }

        const admin = await User.create({ name, email, password, role: 'admin', isVerified: true });
        res.status(201).json({ success: true, user: admin });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
