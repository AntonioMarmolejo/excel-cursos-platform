const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/commentController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/:videoId',       protect, ctrl.getByVideo);
router.post('/',              protect, ctrl.create);
router.post('/:id/reply',     protect, ctrl.reply);
router.patch('/:id/hide',     protect, adminOnly, ctrl.hide);

module.exports = router;
