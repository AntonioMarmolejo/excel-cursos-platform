const Comment = require('../models/Comment');

// ── GET /api/comments/:videoId ────────────────────
exports.getByVideo = async (req, res) => {
    try {
        const comments = await Comment.find({ video: req.params.videoId, isHidden: false })
            .populate('user', 'name')
            .populate('replies.user', 'name role')
            .sort('-createdAt');
        res.json({ success: true, comments });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ── POST /api/comments ────────────────────────────
exports.create = async (req, res) => {
    try {
        const { videoId, courseId, content } = req.body;
        if (!content?.trim())
            return res.status(400).json({ success: false, message: 'El comentario no puede estar vacío' });

        const comment = await Comment.create({
            video: videoId,
            course: courseId,
            user: req.user._id,
            content: content.trim(),
        });

        await comment.populate('user', 'name');
        res.status(201).json({ success: true, comment });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ── POST /api/comments/:id/reply ──────────────────
exports.reply = async (req, res) => {
    try {
        const { content } = req.body;
        if (!content?.trim())
            return res.status(400).json({ success: false, message: 'La respuesta no puede estar vacía' });

        const comment = await Comment.findById(req.params.id);
        if (!comment) return res.status(404).json({ success: false, message: 'Comentario no encontrado' });

        comment.replies.push({
            user: req.user._id,
            content: content.trim(),
            isAdminReply: req.user.role === 'admin',
        });
        await comment.save();
        await comment.populate('user', 'name');
        await comment.populate('replies.user', 'name role');

        res.json({ success: true, comment });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ── DELETE /api/comments/:id (admin) ─────────────
exports.hide = async (req, res) => {
    try {
        const comment = await Comment.findByIdAndUpdate(
            req.params.id, { isHidden: true }, { new: true }
        );
        res.json({ success: true, message: 'Comentario ocultado', comment });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
