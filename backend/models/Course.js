const mongoose = require('mongoose');
const CATEGORIES = require('../config/categories');

const courseSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, required: true },
    level: { type: String, enum: ['basico', 'medio', 'avanzado'], required: true },
    category: { type: String, enum: CATEGORIES.map(c => c.id), default: 'otros', index: true },
    thumbnail: { type: String },   // URL de imagen de portada

    // Precios para compra de por vida del curso individual
    price: {
        lifetime: { type: Number, required: true },   // ej: 49.99
    },

    // Orden de aparición en el catálogo
    order: { type: Number, default: 0 },

    // Flujo de revisión: el instructor envía el curso y el admin lo aprueba.
    // `isPublished` solo lo activa el admin (al aprobar) y es lo que ve el catálogo.
    reviewStatus: { type: String, enum: ['draft', 'pending', 'approved', 'rejected'], default: 'draft' },
    rejectionReason: { type: String, default: '' },
    isPublished: { type: Boolean, default: false },

    // Dueño del curso
    instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    totalVideos: { type: Number, default: 0 },
    totalDuration: { type: Number, default: 0 },  // en segundos
}, {
    timestamps: true,
    toJSON: { virtuals: true },
});

courseSchema.virtual('categoryName').get(function () {
    return CATEGORIES.find(c => c.id === this.category)?.name || 'Otros';
});

// Campos públicos del instructor al hacer populate
courseSchema.statics.INSTRUCTOR_FIELDS = 'name avatar instructorProfile.headline instructorProfile.bio';

// Recalcular totales desde los videos (se llama desde videoController)
courseSchema.methods.recalcTotals = async function () {
    const Video = mongoose.model('Video');
    const videos = await Video.find({ course: this._id, isPublished: true });
    this.totalVideos = videos.length;
    this.totalDuration = videos.reduce((sum, v) => sum + (v.duration || 0), 0);
    return this.save();
};

// ¿Puede este usuario editar el curso? (admin o dueño)
courseSchema.methods.canBeManagedBy = function (user) {
    if (!user) return false;
    if (user.role === 'admin') return true;
    const ownerId = this.instructor?._id || this.instructor;
    return user.role === 'instructor' && ownerId?.toString() === user._id.toString();
};

module.exports = mongoose.model('Course', courseSchema);
