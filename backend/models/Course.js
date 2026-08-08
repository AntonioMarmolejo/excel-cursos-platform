const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, required: true },
    level: { type: String, enum: ['basico', 'medio', 'avanzado'], required: true },
    thumbnail: { type: String },   // URL de imagen de portada

    // Precios para compra de por vida del curso individual
    price: {
        lifetime: { type: Number, required: true },   // ej: 49.99
    },

    // Orden de aparición en el catálogo
    order: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: false },

    // El instructor (siempre tú por ahora, pero preparado para escalar)
    instructor: {
        name: { type: String, default: 'Administrador' },
        avatar: { type: String },
    },

    totalVideos: { type: Number, default: 0 },
    totalDuration: { type: Number, default: 0 },  // en segundos
}, {
    timestamps: true,
});

// Recalcular totales desde los videos (se llama desde videoController)
courseSchema.methods.recalcTotals = async function () {
    const Video = mongoose.model('Video');
    const videos = await Video.find({ course: this._id, isPublished: true });
    this.totalVideos = videos.length;
    this.totalDuration = videos.reduce((sum, v) => sum + (v.duration || 0), 0);
    return this.save();
};

module.exports = mongoose.model('Course', courseSchema);
