const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  course:  { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  title:   { type: String, required: true, trim: true },
  description: { type: String, default: '' },

  // Bunny.net
  bunnyVideoId: { type: String, required: true },   // ID del video en la librería Bunny
  duration:     { type: Number, default: 0 },        // segundos, máx 300 (5 min)

  // Posición dentro del curso (para ordenar)
  order: { type: Number, required: true },

  // Los primeros 4 videos del curso son gratuitos
  // Este campo se calcula automáticamente por el orden
  isFree: { type: Boolean, default: false },

  isPublished: { type: Boolean, default: false },

  // Thumbnail generado por Bunny o personalizado
  thumbnail: { type: String },
}, {
  timestamps: true,
});

// Índice para consultas frecuentes
videoSchema.index({ course: 1, order: 1 });

// Antes de guardar, determinar si es gratuito según su orden
videoSchema.pre('save', function (next) {
  this.isFree = this.order <= 4;
  next();
});

module.exports = mongoose.model('Video', videoSchema);
