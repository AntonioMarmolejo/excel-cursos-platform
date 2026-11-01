const fs = require('fs');
const path = require('path');
const Course = require('../models/Course');
const Video = require('../models/Video');
const Progress = require('../models/Progress');

const CATEGORIES = require('../config/categories');

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// ── GET /api/courses/categories ───────────────────
exports.getCategories = (req, res) => {
    res.json({ success: true, categories: CATEGORIES });
};

// ── GET /api/courses ──────────────────────────────
// Catálogo público (solo publicados). Filtros: ?category=&level=&instructor=&q=
exports.getAll = async (req, res) => {
    try {
        const { category, level, instructor, q } = req.query;
        const query = { isPublished: true };
        if (category) query.category = category;
        if (level) query.level = level;
        if (instructor) query.instructor = instructor;
        if (q?.trim()) {
            const rx = new RegExp(escapeRegex(q.trim()), 'i');
            query.$or = [{ title: rx }, { description: rx }];
        }

        const courses = await Course.find(query)
            .sort('order')
            .populate('instructor', Course.INSTRUCTOR_FIELDS);
        res.json({ success: true, courses });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ── GET /api/courses/:slug ────────────────────────
// Detalle del curso + lista de videos (con info de acceso para el usuario)
exports.getOne = async (req, res) => {
    try {
        const course = await Course.findOne({ slug: req.params.slug })
            .populate('instructor', Course.INSTRUCTOR_FIELDS);
        // Los cursos no publicados solo los ve su dueño o el admin (vista previa)
        const canManage = course?.canBeManagedBy(req.user);
        if (!course || (!course.isPublished && !canManage))
            return res.status(404).json({ success: false, message: 'Curso no encontrado' });

        const videos = await Video.find({ course: course._id, isPublished: true })
            .sort('order')
            .select('title description section order isFree duration thumbnail bunnyVideoId resourceUrl');

        // Si el usuario está autenticado, agregar info de acceso y progreso
        let progress = null;
        let hasAccess = false;

        if (req.user) {
            hasAccess = canManage || req.user.hasCourseAccess(course._id);
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

// Campos que cada rol puede escribir en un curso
const INSTRUCTOR_FIELDS = ['title', 'slug', 'description', 'level', 'category', 'price', 'thumbnail'];
const ADMIN_FIELDS = [...INSTRUCTOR_FIELDS, 'order', 'isPublished', 'reviewStatus', 'rejectionReason', 'instructor'];

const pickAllowed = (body, user) => {
    const allowed = user.role === 'admin' ? ADMIN_FIELDS : INSTRUCTOR_FIELDS;
    return Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k)));
};

// ── GET /api/courses/mine (instructor) ────────────
// Cursos del instructor autenticado, en cualquier estado
exports.getMine = async (req, res) => {
    try {
        const courses = await Course.find({ instructor: req.user._id }).sort('-updatedAt');
        res.json({ success: true, courses });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ── POST /api/courses (instructor/admin) ──────────
exports.create = async (req, res) => {
    try {
        const data = pickAllowed(req.body, req.user);
        if (req.user.role !== 'admin' || !data.instructor) data.instructor = req.user._id;
        // Los cursos del admin pueden publicarse directo; los de instructores nacen en borrador
        if (req.user.role !== 'admin') {
            data.reviewStatus = 'draft';
            data.isPublished = false;
        } else if (data.isPublished) {
            data.reviewStatus = 'approved';
        }

        const course = await Course.create(data);
        res.status(201).json({ success: true, course });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// ── PUT /api/courses/:id (dueño/admin) ────────────
exports.update = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) return res.status(404).json({ success: false, message: 'Curso no encontrado' });
        if (!course.canBeManagedBy(req.user))
            return res.status(403).json({ success: false, message: 'No puedes editar este curso' });

        const data = pickAllowed(req.body, req.user);
        if (req.user.role === 'admin' && data.isPublished === true) data.reviewStatus = 'approved';

        course.set(data);
        await course.save();
        res.json({ success: true, course });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// ── POST /api/courses/:id/submit (dueño) ──────────
// El instructor envía su curso a revisión del admin
exports.submitForReview = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) return res.status(404).json({ success: false, message: 'Curso no encontrado' });
        if (!course.canBeManagedBy(req.user))
            return res.status(403).json({ success: false, message: 'No puedes enviar este curso' });
        if (!['draft', 'rejected'].includes(course.reviewStatus))
            return res.status(400).json({ success: false, message: 'Este curso ya fue enviado o aprobado' });
        if (course.totalVideos < 1)
            return res.status(400).json({ success: false, message: 'Agrega al menos un video publicado antes de enviarlo' });

        course.reviewStatus = 'pending';
        course.rejectionReason = '';
        await course.save();
        res.json({ success: true, course });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ── PUT /api/courses/:id/thumbnail (admin) ────────
exports.uploadThumbnail = async (req, res) => {
    try {
        if (!req.file)
            return res.status(400).json({ success: false, message: 'No se recibió ninguna imagen' });

        const course = await Course.findById(req.params.id);
        if (!course) return res.status(404).json({ success: false, message: 'Curso no encontrado' });
        if (!course.canBeManagedBy(req.user)) {
            fs.unlink(req.file.path, () => { });
            return res.status(403).json({ success: false, message: 'No puedes editar este curso' });
        }

        // Borrar la portada anterior solo si era un archivo subido localmente (no una URL externa)
        if (course.thumbnail?.startsWith('/uploads/')) {
            const oldPath = path.join(__dirname, '..', course.thumbnail);
            fs.unlink(oldPath, () => { });
        }

        course.thumbnail = `/uploads/courses/${req.file.filename}`;
        await course.save();

        res.json({ success: true, course });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ── DELETE /api/courses/:id (dueño/admin) ─────────
exports.remove = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) return res.status(404).json({ success: false, message: 'Curso no encontrado' });
        if (!course.canBeManagedBy(req.user))
            return res.status(403).json({ success: false, message: 'No puedes eliminar este curso' });
        // Un curso publicado puede tener alumnos que lo compraron: solo el admin lo elimina
        if (course.isPublished && req.user.role !== 'admin')
            return res.status(400).json({ success: false, message: 'Un curso publicado solo puede eliminarlo un administrador' });

        await course.deleteOne();
        await Video.deleteMany({ course: req.params.id });
        res.json({ success: true, message: 'Curso eliminado' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
