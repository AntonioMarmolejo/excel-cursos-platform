const Course = require('../models/Course');
const Video = require('../models/Video');
const Progress = require('../models/Progress');

// ── GET /api/courses ──────────────────────────────
// Catálogo público (solo publicados)
exports.getAll = async (req, res) => {
    try {
        const courses = await Course.find({ isPublished: true }).sort('order');
        res.json({ success: true, courses });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ── GET /api/courses/:slug ────────────────────────
// Detalle del curso + lista de videos (con info de acceso para el usuario)
exports.getOne = async (req, res) => {
    try {
        const course = await Course.findOne({ slug: req.params.slug, isPublished: true });
        if (!course) return res.status(404).json({ success: false, message: 'Curso no encontrado' });

        const videos = await Video.find({ course: course._id, isPublished: true })
            .sort('order')
            .select('title description section order isFree duration thumbnail bunnyVideoId resourceUrl');

        // Si el usuario está autenticado, agregar info de acceso y progreso
        let progress = null;
        let hasAccess = false;

        if (req.user) {
            hasAccess = req.user.hasCourseAccess(course._id);
            progress = await Progress.findOne({ user: req.user._id, course: course._id });
        }

        // Enriquecer lista de videos con acceso y estado de progreso
        const videosWithAccess = videos.map(v => {
            const canWatch = v.isFree || hasAccess;
            const vProgress = progress?.videos.find(p => p.video.toString() === v._id.toString());
            return {
                _id: v._id,
                title: v.title,
                description: v.description,
                section: v.section || '',
                order: v.order,
                isFree: v.isFree,
                duration: v.duration,
                thumbnail: v.thumbnail,
                locked: !canWatch,
                // Solo devolver el ID de Bunny (y el recurso descargable) si puede ver el video
                bunnyVideoId: canWatch ? v.bunnyVideoId : null,
                resourceUrl: canWatch ? v.resourceUrl : null,
                completed: vProgress?.completed || false,
                watchedSecs: vProgress?.watchedSecs || 0,
            };
        });

        // Estudiantes que han iniciado este curso (aproximación honesta: quienes tienen progreso registrado)
        const studentsCount = await Progress.countDocuments({ course: course._id });

        res.json({
            success: true,
            course,
            videos: videosWithAccess,
            hasAccess,
            studentsCount,
            progressPercentage: progress?.percentage || 0,
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ── POST /api/courses (admin) ─────────────────────
exports.create = async (req, res) => {
    try {
        const course = await Course.create(req.body);
        res.status(201).json({ success: true, course });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// ── PUT /api/courses/:id (admin) ──────────────────
exports.update = async (req, res) => {
    try {
        const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!course) return res.status(404).json({ success: false, message: 'Curso no encontrado' });
        res.json({ success: true, course });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// ── DELETE /api/courses/:id (admin) ───────────────
exports.remove = async (req, res) => {
    try {
        await Course.findByIdAndDelete(req.params.id);
        await Video.deleteMany({ course: req.params.id });
        res.json({ success: true, message: 'Curso eliminado' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
