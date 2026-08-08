const crypto = require('crypto');
const Video = require('../models/Video');
const Course = require('../models/Course');

// ── Generar URL firmada del iframe embed de Bunny.net ──
// Usa "Embed view token authentication" (no acceso directo al CDN)
const getBunnySignedUrl = (videoId) => {
    const libraryId = process.env.BUNNY_LIBRARY_ID;
    const securityKey = process.env.BUNNY_TOKEN_AUTH_KEY;
    const expiry = Math.floor(Date.now() / 1000) + 60 * 60; // 1 hora

    const token = crypto
        .createHash('sha256')
        .update(`${securityKey}${videoId}${expiry}`)
        .digest('hex');

    return `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}?token=${token}&expires=${expiry}`;
};

// ── GET /api/videos/:id/stream ────────────────────
// Devuelve la URL firmada para reproducir un video
exports.getStreamUrl = async (req, res) => {
    try {
        const video = await Video.findById(req.params.id);
        if (!video || !video.isPublished)
            return res.status(404).json({ success: false, message: 'Video no encontrado' });

        // Verificar acceso
        const canWatch = video.isFree || (req.user && req.user.hasCourseAccess(video.course));
        if (!canWatch)
            return res.status(403).json({ success: false, message: 'Necesitas acceso al curso para ver este video' });

        const streamUrl = getBunnySignedUrl(video.bunnyVideoId);
        res.json({ success: true, streamUrl, videoId: video._id });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ── POST /api/videos (admin) ──────────────────────
exports.create = async (req, res) => {
    try {
        const video = await Video.create(req.body);
        // Recalcular totales del curso
        const course = await Course.findById(video.course);
        if (course) await course.recalcTotals();
        res.status(201).json({ success: true, video });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// ── PUT /api/videos/:id (admin) ───────────────────
exports.update = async (req, res) => {
    try {
        const video = await Video.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!video) return res.status(404).json({ success: false, message: 'Video no encontrado' });
        const course = await Course.findById(video.course);
        if (course) await course.recalcTotals();
        res.json({ success: true, video });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// ── DELETE /api/videos/:id (admin) ────────────────
exports.remove = async (req, res) => {
    try {
        const video = await Video.findByIdAndDelete(req.params.id);
        if (video) {
            const course = await Course.findById(video.course);
            if (course) await course.recalcTotals();
        }
        res.json({ success: true, message: 'Video eliminado' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ── GET /api/videos/course/:courseId (admin) ──────
exports.getByCourse = async (req, res) => {
    try {
        const videos = await Video.find({ course: req.params.courseId }).sort('order');
        res.json({ success: true, videos });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
