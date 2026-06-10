// ─────────────────────────────────────────────────
// routes/videos.js
// ─────────────────────────────────────────────────
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/videoController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/course/:courseId',       protect, adminOnly, ctrl.getByCourse);
router.get('/:id/stream',             protect, ctrl.getStreamUrl);
router.post('/',                      protect, adminOnly, ctrl.create);
router.put('/:id',                    protect, adminOnly, ctrl.update);
router.delete('/:id',                 protect, adminOnly, ctrl.remove);

module.exports = router;
