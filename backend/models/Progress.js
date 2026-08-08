const mongoose = require('mongoose');

const videoProgressSchema = new mongoose.Schema({
    video: { type: mongoose.Schema.Types.ObjectId, ref: 'Video', required: true },
    completed: { type: Boolean, default: false },
    watchedSecs: { type: Number, default: 0 },    // segundos vistos
    completedAt: { type: Date },
}, { _id: false });

const progressSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },

    videos: [videoProgressSchema],

    // Porcentaje calculado
    percentage: { type: Number, default: 0, min: 0, max: 100 },

    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
}, {
    timestamps: true,
});

progressSchema.index({ user: 1, course: 1 }, { unique: true });

// Recalcular porcentaje de completitud
progressSchema.methods.recalcPercentage = async function () {
    const Video = mongoose.model('Video');
    const total = await Video.countDocuments({ course: this.course, isPublished: true });
    if (total === 0) { this.percentage = 0; return; }
    const done = this.videos.filter(v => v.completed).length;
    this.percentage = Math.round((done / total) * 100);
    if (this.percentage === 100 && !this.completedAt) {
        this.completedAt = new Date();
    }
};

module.exports = mongoose.model('Progress', progressSchema);
