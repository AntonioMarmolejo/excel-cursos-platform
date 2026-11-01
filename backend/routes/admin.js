const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/stats',                    protect, adminOnly, ctrl.getStats);
router.get('/courses',                  protect, adminOnly, ctrl.getAllCourses);
router.put('/courses/:id/review',       protect, adminOnly, ctrl.reviewCourse);
router.get('/instructor-applications',  protect, adminOnly, ctrl.getInstructorApplications);
router.put('/instructor-applications/:id', protect, adminOnly, ctrl.reviewInstructorApplication);
router.get('/users',                    protect, adminOnly, ctrl.getUsers);
router.get('/users/:id/progress',       protect, adminOnly, ctrl.getUserProgress);
router.put('/users/:id/access',         protect, adminOnly, ctrl.updateAccess);
router.get('/comments',                 protect, adminOnly, ctrl.getComments);
router.put('/comments/:id/toggle',      protect, adminOnly, ctrl.toggleComment);
router.post('/create-admin',                               ctrl.createAdmin);

module.exports = router;
