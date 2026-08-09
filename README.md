# Cursos de Excel — Plataforma de e-learning
Plataforma web para vender y ver cursos en video de Excel: catálogo de cursos, reproductor con progreso por lección, comentarios con respuestas, certificados automáticos al completar un curso, perfil de usuario con foto editable, y un panel de administración completo para gestionar cursos, videos, usuarios y comentarios.

## Stack tecnológico

### Backend

- **Node.js + Express** — API REST
- **MongoDB + Mongoose** — base de datos
- **JWT** (`jsonwebtoken`) + **bcryptjs** — autenticación y hash de contraseñas
- **Multer** — subida de archivos (avatares de usuario, a disco local)
- **Nodemailer** — envío de emails (verificación de cuenta, reset de contraseña)
- **Bunny.net Stream** — hosting y streaming de video (embed con token firmado, no acceso directo al CDN)
- **nodemon** — recarga automática en desarrollo

### Frontend

- **React 19 + Vite** — SPA
- **React Router v7** — ruteo
- **Axios** — cliente HTTP con interceptores (JWT automático, redirect a `/login` en 401)
- **CSS plano con metodología BEM** — sin frameworks de UI; cada componente tiene su propio archivo en `src/styles/`, con variables CSS para el tema oscuro
- **ESLint** — linting

### Infraestructura / Despliegue

- **PM2** — proceso del backend en producción
- **Nginx** — reverse proxy (sirve el build de React y hace proxy de `/api/` y `/uploads/` al backend)
- **Certbot / Let's Encrypt** — SSL
- Pensado para una VM Ubuntu (ej. Google Cloud Compute Engine)

## Funcionalidades

**Autenticación**

- Registro, login, verificación de email, recuperación y reset de contraseña
- JWT con expiración configurable

**Cursos y video**

- Catálogo público de cursos, con niveles (básico/medio/avanzado)
- Página de presentación del curso: instructor, categoría, programa dividido en secciones (acordeón), pestaña de instructor con biografía
- Reproductor de lecciones: barra de progreso, buscador y navegación por secciones en el sidebar, botón de completar manual (además de auto-completado al terminar el video), navegación anterior/siguiente, recurso descargable opcional por lección
- Los primeros 4 videos de cada curso son gratuitos; el resto requiere suscripción o compra individual
- Streaming vía Bunny.net con URLs firmadas (expiran, no se puede acceder al video sin pasar por la app)

**Progreso y certificados**

- Progreso por curso y por video, calculado en base a videos completados
- Certificado descargable/imprimible (se genera en el navegador) que aparece automáticamente al llegar al 100% de un curso

**Comentarios**

- Comentarios por video, con respuestas anidadas
- Las respuestas del staff se marcan como "Instructor"
- Moderación desde el panel admin (ocultar/mostrar)

**Perfil de usuario**

- Datos reales del usuario, estadísticas de cursos (matriculados, en progreso, finalizados)
- Foto de perfil editable (subida real de archivo, servida desde el backend)
- Certificados obtenidos

**Panel de administración**

- Dashboard con estadísticas generales
- CRUD completo de cursos y videos (incluye secciones del programa y recursos descargables)
- Gestión de usuarios: búsqueda, asignar/revocar acceso a cursos, activar/cancelar suscripciones
- Moderación de comentarios

## Estructura del proyecto

```
web_project_excell_course/
├── backend/
│   ├── config/          # Conexión a MongoDB
│   ├── controllers/     # Lógica de cada recurso (auth, courses, videos, comments, progress, admin)
│   ├── middleware/      # JWT (protect/adminOnly) y subida de archivos (multer)
│   ├── models/          # Esquemas de Mongoose (User, Course, Video, Progress, Comment)
│   ├── routes/          # Definición de endpoints por recurso
│   ├── uploads/          # Avatares subidos (no versionado, ver .gitignore)
│   ├── seed-test-course.js  # Script para sembrar un curso de prueba con IDs reales de Bunny
│   └── server.js
├── frontend/
│   └── src/
│       ├── api/          # Cliente axios + helpers de URLs de archivos
│       ├── components/   # Componentes reutilizables (Navbar, VideoPlayer, VideoList, CommentSection, etc.)
│       ├── context/       # AuthContext
│       ├── pages/         # Páginas (Home, CoursePage, ProfilePage, Login, panel admin, etc.)
│       ├── styles/         # Un .css por componente/página, metodología BEM
│       └── utils/          # Helpers compartidos (agrupar videos por sección, etc.)
├── ecosystem.config.js   # Configuración de PM2
├── nginx.conf            # Config de referencia para producción
└── README2.md            # (duplicado histórico, ver nota abajo)
```

## Requisitos previos

- Node.js 18+
- MongoDB (local con MongoDB Compass, o un cluster de MongoDB Atlas)
- Una cuenta de Bunny.net con una **Video Library** (Stream) activa
- Una cuenta de email para enviar correos vía SMTP (ej. Gmail con contraseña de aplicación)

## Desarrollo local

```bash
# Backend
cd backend
cp .env.example .env      # completa con tus credenciales reales
npm install
npm run dev                # http://localhost:5000

# Frontend (en otra terminal)
cd frontend
cp .env.example .env       # define VITE_API_URL si no usas el default
npm install
npm run dev                 # http://localhost:5173
```

### Crear el primer administrador

```bash
curl -X POST http://localhost:5000/api/admin/create-admin \
  -H "Content-Type: application/json" \
  -d '{
    "secret": "TU_ADMIN_SECRET_DEL_ENV",
    "name": "Tu nombre",
    "email": "admin@tucorreo.com",
    "password": "contraseña_segura"
  }'
```

### Sembrar un curso de prueba

```bash
cd backend
node seed-test-course.js
```

## Variables de entorno (backend `.env`)

| Variable                                              | Descripción                                                                                |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PORT`                                                | Puerto del servidor (default 5000)                                                         |
| `NODE_ENV`                                            | `development` \| `production`                                                              |
| `MONGODB_URI`                                         | Cadena de conexión de MongoDB (Atlas o local)                                              |
| `JWT_SECRET` / `JWT_EXPIRES_IN`                       | Firma y expiración de tokens                                                               |
| `BUNNY_LIBRARY_ID`                                    | ID de la Video Library en Bunny Stream                                                     |
| `BUNNY_TOKEN_AUTH_KEY`                                | Clave de **Token authentication** (pestaña Security de la librería, no la API Key general) |
| `BUNNY_CDN_HOSTNAME`                                  | Referencia histórica, no usado directamente en el código actual                            |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | Credenciales de envío de correo                                                            |
| `ADMIN_SECRET`                                        | Clave requerida para crear el primer admin vía `/api/admin/create-admin`                   |
| `CLIENT_URL`                                          | Origen permitido por CORS (URL del frontend)                                               |

## Bunny.net — configuración necesaria

El reproductor usa el **embed con token firmado** de Bunny Stream, no acceso directo al CDN. En la librería de Bunny, dentro de **Security**:

1. Activa **Block direct URL file access**
2. Activa **Embed view token authentication** y copia la **Token authentication key** (no la API Key) a `BUNNY_TOKEN_AUTH_KEY`
3. En **Allowed domains**, agrega los dominios desde los que se va a incrustar el reproductor (`localhost` en desarrollo, tu dominio en producción)
4. Sube los videos (máx. 5 minutos por video en el diseño actual) y copia el **Video ID** de cada uno para cargarlo desde el panel admin

Bunny funciona con saldo prepago (no es una suscripción fija) — revisa el estado del trial/saldo en el dashboard antes de asumir que un video no carga por un bug de código.

## Endpoints principales de la API

| Método          | Ruta                                                   | Acceso               | Descripción                                                        |
| --------------- | ------------------------------------------------------ | -------------------- | ------------------------------------------------------------------ |
| POST            | `/api/auth/register`                                   | Público              | Registro                                                           |
| POST            | `/api/auth/login`                                      | Público              | Login                                                              |
| GET             | `/api/auth/me`                                         | Usuario              | Perfil del usuario autenticado                                     |
| PUT             | `/api/auth/me/avatar`                                  | Usuario              | Subir/actualizar foto de perfil                                    |
| GET             | `/api/auth/verify/:token`                              | Público              | Verificar email                                                    |
| POST            | `/api/auth/forgot-password` / `/reset-password/:token` | Público              | Recuperar contraseña                                               |
| GET             | `/api/courses`                                         | Público              | Catálogo de cursos publicados                                      |
| GET             | `/api/courses/:slug`                                   | Público\*            | Detalle del curso, videos (con bloqueo según acceso) y estudiantes |
| POST/PUT/DELETE | `/api/courses/:id`                                     | Admin                | CRUD de cursos                                                     |
| GET             | `/api/videos/:id/stream`                               | Usuario              | URL firmada de Bunny para reproducir                               |
| POST/PUT/DELETE | `/api/videos` / `/api/videos/:id`                      | Admin                | CRUD de videos                                                     |
| GET             | `/api/progress`                                        | Usuario              | Progreso en todos mis cursos                                       |
| POST            | `/api/progress/video`                                  | Usuario              | Marcar video como visto/completado                                 |
| GET             | `/api/comments/:videoId`                               | Usuario              | Comentarios de un video                                            |
| POST            | `/api/comments` / `/:id/reply`                         | Usuario              | Comentar / responder                                               |
| PATCH           | `/api/comments/:id/hide`                               | Admin                | Ocultar/mostrar comentario                                         |
| GET             | `/api/admin/stats`                                     | Admin                | Estadísticas del dashboard                                         |
| GET             | `/api/admin/users`                                     | Admin                | Lista/búsqueda de usuarios                                         |
| PUT             | `/api/admin/users/:id/access`                          | Admin                | Otorgar/revocar acceso o suscripción                               |
| GET             | `/api/admin/comments`                                  | Admin                | Todos los comentarios (moderación)                                 |
| POST            | `/api/admin/create-admin`                              | Clave `ADMIN_SECRET` | Crear el primer usuario admin                                      |

\* `/api/courses/:slug` acepta un token opcional: si envías uno válido, la respuesta incluye qué videos están desbloqueados para ese usuario.

## Despliegue en producción (VM Ubuntu)

```bash
sudo apt update && sudo apt install -y nodejs npm nginx
sudo npm install -g pm2

cd /var/www/excel-cursos
cd backend && npm install --production
cp .env.example .env && nano .env   # completar con datos reales de producción

cd ..
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup

sudo cp nginx.conf /etc/nginx/sites-available/excel-cursos
sudo ln -s /etc/nginx/sites-available/excel-cursos /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d tudominio.com -d www.tudominio.com

# Frontend: generar el build antes de servirlo con Nginx
cd frontend && npm install && npm run build
```

`nginx.conf` hace proxy tanto de `/api/` como de `/uploads/` (donde se sirven los avatares subidos) — si cambias la config, no olvides mantener ambos bloques.

## Estado del proyecto

- ✅ Auth, catálogo, reproductor con progreso, comentarios, perfil con avatar, certificados automáticos, panel admin completo
- ⏳ **Pagos**: pendiente. Por ahora el acceso a cursos (suscripción o compra individual) se asigna manualmente desde el panel admin
- ⏳ **Cuestionarios/certificaciones con nota de aprobación**: no implementado — la plataforma no fabrica esos datos, simplemente no los muestra hasta que exista el sistema real
