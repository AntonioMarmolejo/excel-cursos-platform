const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/courseController');
const { protect, optionalAuth, instructorOrAdmin } = require('../middleware/auth');
const { uploadCourseThumbnail } = require('../middleware/upload');

// Público (con usuario opcional para saber si tiene acceso)
router.get('/', ctrl.getAll);
router.get('/categories', ctrl.getCategories);
router.get('/mine', protect, instructorOrAdmin, ctrl.getMine);
router.get('/:slug', optionalAuth, ctrl.getOne);

// Instructor (dueño del curso) o admin — la propiedad se valida en el controlador
router.post('/', protect, instructorOrAdmin, ctrl.create);
router.put('/:id', protect, instructorOrAdmin, ctrl.update);
router.post('/:id/submit', protect, instructorOrAdmin, ctrl.submitForReview);
router.put('/:id/thumbnail', protect, instructorOrAdmin, uploadCourseThumbnail.single('thumbnail'), ctrl.uploadThumbnail);
router.delete('/:id', protect, instructorOrAdmin, ctrl.remove);

module.exports = router;
