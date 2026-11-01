const crypto = require('crypto');
const Video = require('../models/Video');
const Course = require('../models/Course');
const User = require('../models/User');

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

        // Verificar acceso (alumno con compra/suscripción, o dueño del curso/admin)
        let canWatch = video.isFree || (req.user && req.user.hasCourseAccess(video.course));
        if (!canWatch && req.user) {
            const course = await Course.findById(video.course);
            canWatch = !!course?.canBeManagedBy(req.user);
        }
        if (!canWatch)
            return res.status(403).json({ success: false, message: 'Necesitas acceso al curso para ver este video' });

        const streamUrl = getBunnySignedUrl(video.bunnyVideoId);
        res.json({ success: true, streamUrl, videoId: video._id });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ── Helpers de la API de Bunny Stream ─────────────
const BUNNY_API = 'https://video.bunnycdn.com';

const bunnyRequest = async (path, options = {}) => {
    const apiKey = process.env.BUNNY_API_KEY;
    if (!apiKey) {
        const err = new Error('Falta configurar BUNNY_API_KEY en el servidor (pestaña API de la librería en Bunny)');
        err.status = 500;
        throw err;
    }
    return fetch(`${BUNNY_API}/library/${process.env.BUNNY_LIBRARY_ID}${path}`, {
        ...options,
        headers: { AccessKey: apiKey, accept: 'application/json', 'content-type': 'application/json', ...options.headers },
    });
};

// Cada instructor sube a su propia colección dentro de la librería.
// Se crea la primera vez que sube un video.
const getInstructorCollection = async (user) => {
    if (user.instructorProfile?.bunnyCollectionId) return user.instructorProfile.bunnyCollectionId;

    const bunnyRes = await bunnyRequest('/collections', {
        method: 'POST',
        body: JSON.stringify({ name: `${user.name} (${user._id})` }),
    });
    if (!bunnyRes.ok) throw new Error('No se pudo crear la colección del instructor en Bunny');
    const { guid } = await bunnyRes.json();

    await User.updateOne({ _id: user._id }, { 'instructorProfile.bunnyCollectionId': guid });
    user.instructorProfile.bunnyCollectionId = guid;
    return guid;
};

// Un instructor solo puede usar videos de su propia colección (el admin, cualquiera)
const assertBunnyVideoOwnership = async (bunnyVideoId, user) => {
    if (user.role === 'admin') return;
    const bunnyRes = await bunnyRequest(`/videos/${encodeURIComponent(bunnyVideoId)}`);
    const data = bunnyRes.ok ? await bunnyRes.json() : null;
    if (!data || !user.instructorProfile?.bunnyCollectionId || data.collectionId !== user.instructorProfile.bunnyCollectionId) {
        const err = new Error('Ese video no pertenece a tu librería');
        err.status = 403;
        throw err;
    }
};

// Carga el curso y verifica que el usuario lo pueda gestionar
const loadManagedCourse = async (courseId, user) => {
    const course = await Course.findById(courseId);
    if (!course) {
        const err = new Error('Curso no encontrado');
        err.status = 404;
        throw err;
    }
    if (!course.canBeManagedBy(user)) {
        const err = new Error('No puedes gestionar los videos de este curso');
        err.status = 403;
        throw err;
    }
    return course;
};

const sendError = (res, err, fallbackStatus = 500) =>
    res.status(err.status || fallbackStatus).json({ success: false, message: err.message });

// ── POST /api/videos/upload-credentials (dueño/admin) ──
// Crea el video vacío en Bunny y devuelve la firma para que el navegador
// suba el archivo directo a Bunny por TUS (sin pasar por nuestro servidor).
exports.getUploadCredentials = async (req, res) => {
    try {
        const { courseId, title } = req.body;
        await loadManagedCourse(courseId, req.user);

        const collectionId = await getInstructorCollection(req.user);
        const bunnyRes = await bunnyRequest('/videos', {
            method: 'POST',
            body: JSON.stringify({ title: title?.trim() || 'Sin título', collectionId }),
        });
        if (!bunnyRes.ok) return res.status(502).json({ success: false, message: 'Bunny no pudo crear el video' });
        const { guid } = await bunnyRes.json();

        const libraryId = process.env.BUNNY_LIBRARY_ID;
        const expires = Math.floor(Date.now() / 1000) + 6 * 60 * 60; // 6 horas para subir
        // Firma oficial de TUS en Bunny: sha256(library_id + api_key + expiration_time + video_id)
        const signature = crypto
            .createHash('sha256')
            .update(`${libraryId}${process.env.BUNNY_API_KEY}${expires}${guid}`)
            .digest('hex');

        res.json({ success: true, bunnyVideoId: guid, libraryId, expires, signature });
    } catch (err) {
        sendError(res, err);
    }
};

// ── GET /api/videos/bunny-info/:bunnyVideoId (instructor/admin) ──
// Consulta la API de Bunny Stream para traer metadatos reales del video
// (usado para autocompletar la duración en el formulario)
exports.getBunnyInfo = async (req, res) => {
    try {
        await assertBunnyVideoOwnership(req.params.bunnyVideoId, req.user);
        const bunnyRes = await bunnyRequest(`/videos/${encodeURIComponent(req.params.bunnyVideoId)}`);

        if (!bunnyRes.ok) {
            return res.status(bunnyRes.status === 404 ? 404 : 502).json({
                success: false,
                message: 'No se encontró ese video en Bunny (revisa el ID)',
            });
        }

        const data = await bunnyRes.json();
        // `length` viene en segundos según la API de Bunny Stream.
        // `status` 4 = terminado de codificar (antes de eso la duración puede ser 0)
        res.json({
            success: true,
            duration: Math.round(data.length || 0),
            title: data.title,
            ready: data.status === 4,
        });
    } catch (err) {
        sendError(res, err);
    }
};

// ── POST /api/videos (dueño/admin) ────────────────
exports.create = async (req, res) => {
    try {
        const course = await loadManagedCourse(req.body.course, req.user);
        await assertBunnyVideoOwnership(req.body.bunnyVideoId, req.user);

        const video = await Video.create(req.body);
        await course.recalcTotals();
        res.status(201).json({ success: true, video });
    } catch (err) {
        sendError(res, err, 400);
    }
};

// ── PUT /api/videos/:id (dueño/admin) ─────────────
exports.update = async (req, res) => {
    try {
        const video = await Video.findById(req.params.id);
        if (!video) return res.status(404).json({ success: false, message: 'Video no encontrado' });
        const course = await loadManagedCourse(video.course, req.user);

        // No se permite mover el video a otro curso
        const { course: _ignored, ...data } = req.body;
        if (data.bunnyVideoId && data.bunnyVideoId !== video.bunnyVideoId)
            await assertBunnyVideoOwnership(data.bunnyVideoId, req.user);

        video.set(data);
        await video.save();
        await course.recalcTotals();
        res.json({ success: true, video });
    } catch (err) {
        sendError(res, err, 400);
    }
};

// ── DELETE /api/videos/:id (dueño/admin) ──────────
exports.remove = async (req, res) => {
    try {
        const video = await Video.findById(req.params.id);
        if (!video) return res.status(404).json({ success: false, message: 'Video no encontrado' });
        const course = await loadManagedCourse(video.course, req.user);

        await video.deleteOne();
        await course.recalcTotals();
        res.json({ success: true, message: 'Video eliminado' });
    } catch (err) {
        sendError(res, err);
    }
};

// ── GET /api/videos/course/:courseId (dueño/admin) ─
exports.getByCourse = async (req, res) => {
    try {
        const course = await loadManagedCourse(req.params.courseId, req.user);
        const videos = await Video.find({ course: req.params.courseId }).sort('order');

        // Videos recién subidos se guardan con duración 0 mientras Bunny los codifica:
        // al listar, se completa la duración de los que ya terminaron.
        const pending = videos.filter(v => !v.duration);
        if (pending.length) {
            const results = await Promise.allSettled(pending.map(async (v) => {
                const bunnyRes = await bunnyRequest(`/videos/${encodeURIComponent(v.bunnyVideoId)}`);
                const data = bunnyRes.ok ? await bunnyRes.json() : null;
                if (data?.status === 4 && data.length) {
                    v.duration = Math.round(data.length);
                    await v.save();
                    return true;
                }
                return false;
            }));
            if (results.some(r => r.value)) await course.recalcTotals();
        }

        res.json({ success: true, videos });
    } catch (err) {
        sendError(res, err);
    }
};
