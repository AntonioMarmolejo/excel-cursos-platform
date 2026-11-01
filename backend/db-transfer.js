// ─────────────────────────────────────────────────
// Copia la base de datos entre servidores mediante un archivo JSON (EJSON,
// conserva ObjectId y fechas). Sirve para pasar los datos locales a Atlas
// cuando no hay conexión directa entre ambos.
//
//   node db-transfer.js export datos.json     ← usa MONGODB_URI del .env (ej. tu PC)
//   node db-transfer.js import datos.json     ← en el servidor, hacia Atlas
//
// La importación se niega a escribir en colecciones que ya tienen datos,
// salvo que se agregue --force (que reemplaza su contenido).
// ─────────────────────────────────────────────────
require('dotenv').config();
const fs = require('fs');
const mongoose = require('mongoose');
const { EJSON } = mongoose.mongo.BSON;

const [mode, file, flag] = process.argv.slice(2);

async function exportDb() {
    const db = mongoose.connection.db;
    const collections = await db.listCollections({}, { nameOnly: true }).toArray();
    const dump = {};
    for (const { name } of collections) {
        if (name.startsWith('system.')) continue;
        dump[name] = await db.collection(name).find().toArray();
        console.log(`  ${name}: ${dump[name].length} documentos`);
    }
    fs.writeFileSync(file, EJSON.stringify(dump, { relaxed: false }));
    console.log(`✅ Exportado a ${file}`);
}

async function importDb() {
    const db = mongoose.connection.db;
    const dump = EJSON.parse(fs.readFileSync(file, 'utf8'), { relaxed: false });

    for (const [name, docs] of Object.entries(dump)) {
        const existing = await db.collection(name).countDocuments();
        if (existing && flag !== '--force') {
            throw new Error(`La colección "${name}" ya tiene ${existing} documentos. Usa --force para reemplazarla.`);
        }
    }

    for (const [name, docs] of Object.entries(dump)) {
        await db.collection(name).deleteMany({});
        if (docs.length) await db.collection(name).insertMany(docs);
        console.log(`  ${name}: ${docs.length} documentos`);
    }

    // Recrea los índices definidos en los modelos (emails únicos, etc.)
    for (const model of ['User', 'Course', 'Video', 'Progress', 'Comment']) {
        await require(`./models/${model}`).syncIndexes();
    }
    console.log(`✅ Importado en la base "${db.databaseName}"`);
}

async function run() {
    if (!['export', 'import'].includes(mode) || !file) {
        console.log('Uso: node db-transfer.js export|import <archivo.json> [--force]');
        process.exit(1);
    }
    await mongoose.connect(process.env.MONGODB_URI);
    console.log(`Base de datos: ${mongoose.connection.name}`);
    await (mode === 'export' ? exportDb() : importDb());
    await mongoose.disconnect();
}

run().catch(err => { console.error('❌', err.message); process.exit(1); });
