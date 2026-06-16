# Guía de despliegue — Cursos de Excel

## 1\. Desarrollo local

```bash
cd backend
cp .env.example .env
# Edita .env con tus credenciales reales

npm install
npm run dev       # Corre en http://localhost:5000
```

## 2\. Crear el primer administrador

```bash
curl -X POST http://localhost:5000/api/admin/create-admin \\\\
  -H "Content-Type: application/json" \\\\
  -d '{
    "secret": "TU\\\_ADMIN\\\_SECRET\\\_DEL\\\_ENV",
    "name": "Tu nombre",
    "email": "admin@tucorreo.com",
    "password": "contraseña\\\_segura"
  }'
```

## 3\. Crear un curso de prueba

```bash
# Primero login para obtener token
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \\\\
  -H "Content-Type: application/json" \\\\
  -d '{"email":"admin@tucorreo.com","password":"contraseña\\\_segura"}' \\\\
  | python3 -c "import sys,json; print(json.load(sys.stdin)\\\['token'])")

# Crear curso básico
curl -X POST http://localhost:5000/api/courses \\\\
  -H "Content-Type: application/json" \\\\
  -H "Authorization: Bearer $TOKEN" \\\\
  -d '{
    "title": "Excel Básico",
    "slug": "excel-basico",
    "description": "Aprende Excel desde cero: fórmulas, tablas y gráficos básicos.",
    "level": "basico",
    "price": { "lifetime": 29.99 },
    "order": 1,
    "isPublished": true
  }'
```

## 4\. Agregar un video al curso

```bash
curl -X POST http://localhost:5000/api/videos \\\\
  -H "Content-Type: application/json" \\\\
  -H "Authorization: Bearer $TOKEN" \\\\
  -d '{
    "course": "ID\\\_DEL\\\_CURSO",
    "title": "Introducción a Excel",
    "description": "Conoce la interfaz de Excel y sus elementos principales.",
    "bunnyVideoId": "ID\\\_VIDEO\\\_EN\\\_BUNNY",
    "duration": 240,
    "order": 1,
    "isPublished": true
  }'
```

## 5\. Despliegue en Google Cloud (VM Ubuntu)

```bash
# En tu VM
sudo apt update \\\&\\\& sudo apt install -y nodejs npm nginx

# Instalar PM2 globalmente
sudo npm install -g pm2

# Clonar/subir el proyecto
cd /var/www/excel-cursos

# Instalar dependencias del backend
cd backend \\\&\\\& npm install --production

# Configurar .env de producción
cp .env.example .env
nano .env   # Llenar con datos reales

# Iniciar con PM2
cd ..
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup   # Seguir las instrucciones que imprime

# Configurar Nginx
sudo cp nginx.conf /etc/nginx/sites-available/excel-cursos
sudo ln -s /etc/nginx/sites-available/excel-cursos /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# SSL con Certbot
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d tudominio.com -d www.tudominio.com
```

## 6\. Endpoints del API

|Método|Ruta|Acceso|Descripción|
|-|-|-|-|
|POST|/api/auth/register|Público|Registro|
|POST|/api/auth/login|Público|Login|
|GET|/api/auth/me|Usuario|Perfil|
|GET|/api/courses|Público|Catálogo|
|GET|/api/courses/:slug|Público|Detalle + videos|
|GET|/api/videos/:id/stream|Usuario|URL firmada Bunny|
|POST|/api/progress/video|Usuario|Marcar progreso|
|GET|/api/progress|Usuario|Mi progreso|
|POST|/api/comments|Usuario|Comentar video|
|POST|/api/comments/:id/reply|Usuario|Responder comentario|
|GET|/api/admin/stats|Admin|Estadísticas|
|GET|/api/admin/users|Admin|Lista usuarios|
|GET|/api/admin/users/:id/progress|Admin|Progreso de usuario|
|GET|/api/admin/comments|Admin|Todos los comentarios|

## 7\. Bunny.net — configuración de seguridad

1. En Bunny.net → tu librería → Security:

   * Activar **Token Authentication**
   * Copiar el **Token Authentication Key** → `BUNNY\\\_TOKEN\\\_AUTH\\\_KEY` en tu .env
   * En **Allowed Referrers**: agregar `tudominio.com`
2. Subir videos desde el panel de Bunny (máx 5 min = 300 seg)

   * Copiar el **Video ID** de cada video para usarlo en la API

