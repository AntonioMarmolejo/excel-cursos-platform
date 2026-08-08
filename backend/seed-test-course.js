require('dotenv').config();
const mongoose = require('mongoose');
const Course = require('./models/Course');
const Video = require('./models/Video');

const videos = [
    { title: 'Barra de Herramientas de acceso rápido', bunnyVideoId: 'd33b03d8-a2a1-4a09-9c98-eeb56f3476da', order: 1 },
    { title: 'Cinta de opciones', bunnyVideoId: '8ee0a17e-dbff-4147-961c-f74a213673a6', order: 2 },
    { title: 'Ventana de Excel: primer vistazo', bunnyVideoId: 'f33a557d-2dd0-464a-b874-5e328dd433bc', order: 3 },
    { title: 'Personalizar barra de herramientas', bunnyVideoId: 'e6d5fd68-8b7e-4659-b916-295c75d9b36a', order: 4 },
];

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);

    let course = await Course.findOne({ slug: 'excel-basico' });
    if (!course) {
        course = await Course.create({
            title: 'Excel Básico',
            slug: 'excel-basico',
            description: 'Aprende los fundamentos de Excel desde cero: la interfaz, la cinta de opciones y la barra de herramientas.',
            level: 'basico',
            price: { lifetime: 29.99 },
            isPublished: true,
            order: 1,
        });
        console.log('Curso creado:', course.slug);
    } else {
        console.log('Curso ya existía:', course.slug);
    }

    for (const v of videos) {
        const exists = await Video.findOne({ course: course._id, bunnyVideoId: v.bunnyVideoId });
        if (exists) {
            console.log('Video ya existía:', v.title);
            continue;
        }
        await Video.create({
            course: course._id,
            title: v.title,
            bunnyVideoId: v.bunnyVideoId,
            order: v.order,
            isPublished: true,
        });
        console.log('Video creado:', v.title);
    }

    await course.recalcTotals();
    console.log('Totales recalculados:', course.totalVideos, 'videos');

    await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
