// PM2: mantiene vivo el backend de eccursos en el servidor.
// Comparte la VM con Flujo (puerto 5000), por eso eccursos usa el 5100.
module.exports = {
  apps: [
    {
      name:        'eccursos-backend',
      cwd:         './backend',          // dotenv lee backend/.env desde aquí
      script:      'server.js',
      instances:   1,
      autorestart: true,
      watch:       false,
      max_memory_restart: '400M',
      env_production: {
        NODE_ENV: 'production',
        PORT:     5100,
      },
    },
  ],
};
