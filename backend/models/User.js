const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const subscriptionSchema = new mongoose.Schema({
    plan: { type: String, enum: ['mensual', 'anual', 'lifetime'], default: null },
    status: { type: String, enum: ['active', 'expired', 'cancelled', 'pending'], default: 'pending' },
    startDate: { type: Date },
    endDate: { type: Date },   // null = lifetime
    // Cursos comprados individualmente (acceso de por vida al curso específico)
    courseAccess: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
}, { _id: false });

// Perfil público de instructor + estado de su solicitud
const instructorProfileSchema = new mongoose.Schema({
    status: { type: String, enum: ['none', 'pending', 'approved', 'rejected'], default: 'none' },
    headline: { type: String, default: '', trim: true },     // ej: "Desarrollador Full Stack"
    bio: { type: String, default: '' },
    expertise: { type: String, default: '' },                 // áreas que enseñará
    website: { type: String, default: '', trim: true },
    sampleUrl: { type: String, default: '', trim: true },     // video/portafolio de muestra (solo para la revisión)
    appliedAt: { type: Date },
    reviewedAt: { type: Date },
    rejectionReason: { type: String, default: '' },
    bunnyCollectionId: { type: String },                      // colección propia en la librería de Bunny
}, { _id: false });

const userSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, enum: ['user', 'instructor', 'admin'], default: 'user' },
    avatar: { type: String },   // ruta relativa a /uploads/avatars/

    instructorProfile: { type: instructorProfileSchema, default: () => ({}) },

    subscription: { type: subscriptionSchema, default: () => ({}) },

    // Verificación de email
    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String },

    // Reset de contraseña
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },

    lastLogin: { type: Date },
}, {
    timestamps: true,
});

// ── Hash de contraseña antes de guardar ───────────
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

// ── Comparar contraseña ───────────────────────────
userSchema.methods.comparePassword = async function (candidate) {
    return bcrypt.compare(candidate, this.password);
};

// ── Verificar si tiene acceso activo ─────────────
userSchema.methods.hasActiveSubscription = function () {
    const sub = this.subscription;
    if (!sub || !sub.plan) return false;
    if (sub.status !== 'active') return false;
    if (sub.plan === 'lifetime') return true;
    return sub.endDate && sub.endDate > new Date();
};

// ── Verificar acceso a un curso específico ────────
userSchema.methods.hasCourseAccess = function (courseId) {
    if (this.hasActiveSubscription()) return true;
    return this.subscription.courseAccess.some(
        id => id.toString() === courseId.toString()
    );
};

// ── No retornar password en JSON ──────────────────
userSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.password;
    delete obj.verificationToken;
    delete obj.resetPasswordToken;
    delete obj.resetPasswordExpires;
    return obj;
};

module.exports = mongoose.model('User', userSchema);
