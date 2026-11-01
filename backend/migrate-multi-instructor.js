// ─────────────────────────────────────────────────
// Migración a plataforma multi-instructor (ejecutar una sola vez):
//   node migrate-multi-instructor.js [email-del-admin]
//
// - Asigna los cursos existentes (instructor embebido { name, bio }) al admin
// - Copia la bio del instructor antiguo al perfil del admin si estaba vacía
// - Rellena category ('ofimatica') y reviewStatus según isPublished
// Es idempotente: los cursos ya migrados no se tocan.
// ─────────────────────────────────────────────────
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);

    const email = process.argv[2] || process.env.ADMIN_EMAIL;
    const admin = email
        ? await User.findOne({ email: email.toLowerCase(), role: 'admin' })
        : await User.findOne({ role: 'admin' }).sort('createdAt');
    if (!admin) throw new Error(`No se encontró un usuario admin${email ? ` con email ${email}` : ''}`);
    console.log(`Asignando cursos a: ${admin.name} <${admin.email}>`);

    // Colección cruda: el esquema nuevo no puede leer el instructor embebido antiguo
    const courses = mongoose.connection.collection('courses');
    const legacy = await courses.find({ instructor: { $not: { $type: 'objectId' } } }).toArray();

    let legacyBio = '';
    for (const c of legacy) {
        legacyBio ||= c.instructor?.bio || '';
        await courses.updateOne({ _id: c._id }, {
            $set: {
                instructor: admin._id,
                category: c.category || 'ofimatica',
                reviewStatus: c.isPublished ? 'approved' : 'draft',
                rejectionReason: '',
            },
        });
        console.log(`  ✔ ${c.title}`);
    }

    if (legacyBio && !admin.instructorProfile?.bio) {
        admin.instructorProfile.bio = legacyBio;
        admin.instructorProfile.status = 'approved';
        await admin.save({ validateBeforeSave: false });
        console.log('Bio del instructor copiada al perfil del admin');
    }

    console.log(`Listo: ${legacy.length} curso(s) migrado(s)`);
    await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
