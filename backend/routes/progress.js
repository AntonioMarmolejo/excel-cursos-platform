const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/progressController');
const { protect } = require('../middleware/auth');

router.get('/',              protect, ctrl.getAllProgress);
router.get('/:courseId',     protect, ctrl.getCourseProgress);
router.post('/video',        protect, ctrl.updateVideoProgress);

module.exports = router;
