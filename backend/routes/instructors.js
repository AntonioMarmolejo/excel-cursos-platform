const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/instructorController');
const { protect, instructorOrAdmin } = require('../middleware/auth');

router.post('/apply',  protect,                    ctrl.apply);
router.put('/me',      protect, instructorOrAdmin, ctrl.updateProfile);
router.get('/:id',                                 ctrl.getPublicProfile);

module.exports = router;
