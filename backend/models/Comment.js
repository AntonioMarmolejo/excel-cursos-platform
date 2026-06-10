const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true, maxlength: 1000, trim: true },
  isAdminReply: { type: Boolean, default: false },
}, { timestamps: true });

const commentSchema = new mongoose.Schema({
  video:   { type: mongoose.Schema.Types.ObjectId, ref: 'Video', required: true },
  course:  { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true, maxlength: 1000, trim: true },

  replies: [replySchema],

  // Para moderación desde el panel admin
  isHidden: { type: Boolean, default: false },
}, {
  timestamps: true,
});

commentSchema.index({ video: 1, createdAt: -1 });

module.exports = mongoose.model('Comment', commentSchema);
