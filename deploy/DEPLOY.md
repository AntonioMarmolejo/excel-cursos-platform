# Despliegue de eccursos.com en Google Cloud

eccursos se aloja en **la misma VM de Compute Engine que Flujo**, con la base de datos en **MongoDB Atlas** y el dominio en **Namecheap**.

```
Navegador ──► eccursos.com (DNS Namecheap → IP de la VM)
                 │
                 ▼
           Nginx (80/443, HTTPS con Certbot)
             ├── /            → /var/www/eccursos/frontend/dist  (React compilado)
             ├── /api/        → Node.js :5100  (PM2: eccursos-backend)
             └── /uploads/    → Node.js :5100  (portadas y avatares en disco)
                                   │
                                   ├──► MongoDB Atlas (base "eccursos")
                                   └──► Bunny Stream (videos)
Flujo sigue igual en el puerto 5000.
```

---

## 1. Preparar la VM (una sola vez)

En [Compute Engine → Instancias de VM](https://console.cloud.google.com/compute/instances):

1. **IP estática.** Abre la VM de Flujo → *Editar* → *Interfaces de red* → *Dirección IPv4 externa* → **Reservar dirección IP estática**. Si la IP es efímera, cambia al reiniciar la VM y el dominio dejaría de funcionar. Anota la IP; la usarás en los pasos 2 y 3.
2. **Firewall.** En la misma pantalla de edición, deja marcados **Permitir tráfico HTTP** y **Permitir tráfico HTTPS**.
3. Revisión hecha el 2026-11-01. La VM **`around`** (e2-micro, `us-central1-a`, IP estática `34.133.234.84`, nombre `flujo-ip-estatica`) ya tiene todo instalado:

   | Herramienta | Versión |
   |---|---|
   | Node | v24.14.1 |
   | PM2 | 6.0.14 |
   | Nginx | 1.24.0 (5 sitios más: flujo, stylestore, proyectodiecinueve…) |
   | Certbot | 2.9.0 |

   El puerto 5000 es de Flujo; el **5100 está libre** para eccursos. La RAM es justa (1 GB, ~500 MB libres más 758 MB de swap), pero alcanza: el backend usa ~80 MB y la compilación del frontend ~160 MB. `deploy.sh` compila con baja prioridad y memoria limitada para no afectar a los otros proyectos.

   > **No ejecutes `pm2 restart all`**: reiniciaría Flujo. Usa siempre `pm2 restart eccursos-backend`.

## 2. Base de datos en MongoDB Atlas

Usa el cluster que ya tienes (`flujo-cluster`), con una base de datos nueva llamada `eccursos`.

1. **Database Access → Add New Database User:** usuario `eccursos` con una contraseña larga, y rol *Read and write to any database* (o solo a `eccursos`).
2. **Network Access → Add IP Address:** agrega la **IP estática de la VM**.
3. **Connect → Drivers:** copia la cadena de conexión y agrega `/eccursos` antes del `?`:

   ```
   mongodb+srv://eccursos:<password>@flujo-cluster.h6ykudf.mongodb.net/eccursos?retryWrites=true&w=majority&appName=flujo-cluster
   ```

## 3. DNS en Namecheap

En *Domain List → eccursos.com → Manage → **Advanced DNS***:

1. Borra los registros de estacionamiento (*CNAME www → parkingpage.namecheap.com* y *URL Redirect @*).
2. Agrega:

   | Tipo | Host | Valor | TTL |
   |---|---|---|---|
   | A Record | `@` | IP estática de la VM | Automatic |
   | A Record | `www` | IP estática de la VM | Automatic |

Los cambios suelen tardar entre 5 y 30 minutos. Para comprobarlo, desde tu PC ejecuta `nslookup eccursos.com`; tiene que responder con la IP de la VM.

## 4. Subir el código y configurarlo

En la terminal SSH de la VM:

```bash
sudo mkdir -p /var/www/eccursos && sudo chown $USER:$USER /var/www/eccursos
git clone https://github.com/AntonioMarmolejo/excel-cursos-platform.git /var/www/eccursos
```

> Si el repositorio es privado, GitHub te pedirá usuario y un *Personal Access Token* (no tu contraseña). Créalo en GitHub → Settings → Developer settings → Tokens, con permiso de solo lectura del repositorio.

Crea el archivo de entorno del backend:

```bash
nano /var/www/eccursos/backend/.env
```

```ini
NODE_ENV=production
PORT=5100

MONGODB_URI=mongodb+srv://eccursos:<password>@flujo-cluster.h6ykudf.mongodb.net/eccursos?retryWrites=true&w=majority&appName=flujo-cluster

# Genera uno nuevo con: node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
JWT_SECRET=<clave-larga-y-distinta-a-la-de-desarrollo>
JWT_EXPIRES_IN=7d

BUNNY_API_KEY=<igual que en tu .env local>
BUNNY_LIBRARY_ID=691696
BUNNY_TOKEN_AUTH_KEY=<igual que en tu .env local>

GOOGLE_CLIENT_ID=<cuando lo tengas>

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<tu correo>
SMTP_PASS=<app password de Gmail>

ADMIN_EMAIL=djcamg71@gmail.com
ADMIN_SECRET=<clave-larga>

# El primero es el que se usa en los enlaces de los correos
CLIENT_URL=https://eccursos.com,https://www.eccursos.com
```

Guarda con `Ctrl+O`, `Enter` y sal con `Ctrl+X`. Luego despliega por primera vez:

```bash
bash /var/www/eccursos/deploy/deploy.sh
pm2 startup     # solo la primera vez: ejecuta el comando `sudo env PATH=...` que imprime
```

La última línea del despliegue debe decir `✅ eccursos desplegado`.

## 5. Nginx y HTTPS

```bash
sudo cp /var/www/eccursos/deploy/nginx-eccursos.conf /etc/nginx/sites-available/eccursos
sudo ln -s /etc/nginx/sites-available/eccursos /etc/nginx/sites-enabled/eccursos
sudo nginx -t && sudo systemctl reload nginx
```

Cuando el DNS ya apunte a la VM (paso 3), activa el HTTPS:

```bash
sudo certbot --nginx -d eccursos.com -d www.eccursos.com
```

Certbot agrega el certificado y la redirección de HTTP a HTTPS, y lo renueva solo cada 90 días. Abre **https://eccursos.com** para comprobarlo.

## 6. Pasar tus datos locales a Atlas

Tu red bloquea la conexión directa a Atlas, así que los datos se pasan a través de la VM.

**En tu PC** (PowerShell, carpeta `backend`):

```powershell
node db-transfer.js export datos-eccursos.json
Compress-Archive -Path uploads -DestinationPath uploads.zip
```

**En la terminal SSH**, usa el engranaje ⚙ → **Subir archivo** para subir `datos-eccursos.json` y `uploads.zip` (quedan en tu carpeta personal). Luego:

```bash
cd /var/www/eccursos/backend
node db-transfer.js import ~/datos-eccursos.json
sudo apt-get install -y unzip && unzip -o ~/uploads.zip -d .
rm ~/datos-eccursos.json ~/uploads.zip
pm2 restart eccursos-backend
```

Así se copian tus usuarios (incluida tu cuenta de admin con su contraseña), cursos, videos y progreso.

## 7. Servicios externos

- **Bunny Stream** (librería `curso-excel` → *Security*): en **Allowed domains** agrega `eccursos.com` y `www.eccursos.com`. Deja `localhost` para seguir probando en desarrollo. Si falta este paso, los videos dan error 403 en producción.
- **Google OAuth** (cuando crees el Client ID): en *Orígenes autorizados de JavaScript* agrega `https://eccursos.com` y `https://www.eccursos.com`.

## Actualizar el sitio (cada vez que haya cambios)

1. En tu PC, sube los cambios a la rama `main` en GitHub.
2. En la terminal SSH de la VM:

   ```bash
   bash /var/www/eccursos/deploy/deploy.sh
   ```

## Comandos útiles en la VM

```bash
pm2 status                         # estado de eccursos y Flujo
pm2 logs eccursos-backend          # ver errores del backend en vivo
pm2 restart eccursos-backend       # reiniciar (p. ej. tras cambiar el .env)
sudo tail -f /var/log/nginx/error.log
```
