const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/stats',                    protect, adminOnly, ctrl.getStats);
router.get('/users',                    protect, adminOnly, ctrl.getUsers);
router.get('/users/:id/progress',       protect, adminOnly, ctrl.getUserProgress);
router.get('/comments',                 protect, adminOnly, ctrl.getComments);
router.post('/create-admin',                               ctrl.createAdmin);

module.exports = router;
