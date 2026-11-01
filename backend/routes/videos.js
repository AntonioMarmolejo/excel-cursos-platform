// ─────────────────────────────────────────────────
// routes/videos.js
// ─────────────────────────────────────────────────
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/videoController');
const { protect, instructorOrAdmin } = require('../middleware/auth');

// La propiedad del curso se valida en el controlador
router.get('/course/:courseId',         protect, instructorOrAdmin, ctrl.getByCourse);
router.get('/bunny-info/:bunnyVideoId', protect, instructorOrAdmin, ctrl.getBunnyInfo);
router.post('/upload-credentials',      protect, instructorOrAdmin, ctrl.getUploadCredentials);
router.get('/:id/stream',               protect, ctrl.getStreamUrl);
router.post('/',                        protect, instructorOrAdmin, ctrl.create);
router.put('/:id',                      protect, instructorOrAdmin, ctrl.update);
router.delete('/:id',                   protect, instructorOrAdmin, ctrl.remove);

module.exports = router;
