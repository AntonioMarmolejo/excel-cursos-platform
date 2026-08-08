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

const userSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    avatar: { type: String },   // ruta relativa a /uploads/avatars/



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
