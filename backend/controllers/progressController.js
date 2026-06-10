const Progress = require('../models/Progress');
const Video    = require('../models/Video');

// ── POST /api/progress/video ──────────────────────
// Marcar un video como visto / actualizar segundos vistos
exports.updateVideoProgress = async (req, res) => {
  try {
    const { videoId, courseId, completed, watchedSecs } = req.body;

    // Verificar que el video existe
    const video = await Video.findById(videoId);
    if (!video) return res.status(404).json({ success: false, message: 'Video no encontrado' });

    // Buscar o crear el registro de progreso del curso
    let progress = await Progress.findOne({ user: req.user._id, course: courseId });
    if (!progress) {
      progress = new Progress({ user: req.user._id, course: courseId, videos: [] });
    }

    // Actualizar o agregar entrada del video
    const idx = progress.videos.findIndex(v => v.video.toString() === videoId);
    if (idx >= 0) {
      if (completed !== undefined) {
        progress.videos[idx].completed = completed;
        if (completed && !progress.videos[idx].completedAt) {
          progress.videos[idx].completedAt = new Date();
        }
      }
      if (watchedSecs !== undefined) {
        progress.videos[idx].watchedSecs = Math.max(progress.videos[idx].watchedSecs, watchedSecs);
      }
    } else {
      progress.videos.push({
        video: videoId,
        completed: completed || false,
        watchedSecs: watchedSecs || 0,
        completedAt: completed ? new Date() : undefined,
      });
    }

    await progress.recalcPercentage();
    await progress.save();

    res.json({ success: true, progress });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/progress/:courseId ───────────────────
exports.getCourseProgress = async (req, res) => {
  try {
    const progress = await Progress.findOne({
      user: req.user._id,
      course: req.params.courseId,
    });
    res.json({ success: true, progress: progress || { percentage: 0, videos: [] } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/progress (todos mis cursos) ──────────
exports.getAllProgress = async (req, res) => {
  try {
    const progress = await Progress.find({ user: req.user._id })
      .populate('course', 'title slug level thumbnail');
    res.json({ success: true, progress });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
