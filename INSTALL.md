# GUÍA DE INSTALACIÓN Y DESPLIEGUE

## Instalación Local (Sin Docker)

### Pre-requisitos
- Node.js 20 o superior
- MariaDB/MySQL 11.2 o superior
- npm o yarn

### Pasos

#### 1. Configurar la Base de Datos

Conectarse a MariaDB y crear la base de datos:

```sql
CREATE DATABASE gold CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

#### 2. Clonar e Instalar Dependencias

```bash
# Clonar repositorio
git clone <repository-url>
cd ocmanager2

# Instalar dependencias del monorepo
npm install

# Instalar dependencias del backend
cd api
npm install
cd ..

# Instalar dependencias del frontend
cd web
npm install
cd ..
```

#### 3. Configurar Variables de Entorno

**Raíz del proyecto** (`.env`):
```bash
cp .env.example .env
```

Editar `.env`:
```env
DATABASE_URL="mysql://camilo:Indiana%40%4090081010@labsacme.com:9858/gold"
JWT_SECRET="tu-secreto-jwt-super-seguro-cambiar-en-produccion"
JWT_EXPIRES_IN="7d"
NODE_ENV="development"
API_PORT=3001
WEB_PORT=5173
CORS_ORIGIN="http://localhost:5173"
MAX_FILE_SIZE=10485760
UPLOAD_DIR="./uploads"
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

**Backend** (`api/.env`):
```bash
cd api
cp ../.env.example .env
# Editar con las mismas variables de arriba
cd ..
```

**Frontend** (`web/.env`):
```bash
cd web
cp .env.example .env
# Editar:
echo "VITE_API_URL=http://localhost:3001/api" > .env
cd ..
```

#### 4. Generar Cliente de Prisma y Ejecutar Migraciones

```bash
cd api

# Generar cliente de Prisma
npx prisma generate

# Ejecutar migraciones
npx prisma migrate deploy

# Poblar base de datos con datos de ejemplo
npm run seed

cd ..
```

#### 5. Iniciar Aplicación en Modo Desarrollo

**Opción A - Dos terminales separadas:**

Terminal 1 (Backend):
```bash
npm run dev:api
```

Terminal 2 (Frontend):
```bash
npm run dev:web
```

**Opción B - Una terminal con concurrently:**
```bash
npm run dev
```

#### 6. Acceder a la Aplicación

- **Frontend**: http://localhost:5173
- **API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

**Credenciales de prueba:**
- Admin: `admin@ocmanager.com` / `admin123`
- Cliente: `cliente@acme.com` / `cliente123`

---

## Instalación con Docker (Recomendado)

### Pre-requisitos
- Docker 20.10 o superior
- Docker Compose 2.0 o superior

### Pasos

#### 1. Clonar y Configurar

```bash
git clone <repository-url>
cd ocmanager2
cp .env.example .env
```

Editar `.env` si es necesario (las configuraciones por defecto funcionan).

#### 2. Iniciar Servicios

```bash
docker compose up -d
```

Esto iniciará:
- Base de datos MariaDB (puerto 9858)
- API Backend (puerto 3001)
- Frontend Web (puerto 5173)

#### 3. Ejecutar Migraciones y Seed

```bash
# Entrar al contenedor de la API
docker compose exec api sh

# Dentro del contenedor
npx prisma migrate deploy
npm run seed
exit
```

#### 4. Verificar que todo funcione

```bash
# Ver logs
docker compose logs -f

# Verificar estado de contenedores
docker compose ps
```

#### 5. Acceder a la Aplicación

Igual que en instalación local:
- Frontend: http://localhost:5173
- API: http://localhost:3001

---

## Build para Producción

### Opción 1: Build Local

```bash
# Build completo
npm run build

# O por separado
npm run build:api
npm run build:web

# Iniciar en producción
NODE_ENV=production npm run start:api
npm run start:web
```

### Opción 2: Docker para Producción

Crear `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  db:
    image: mariadb:11.2
    restart: always
    environment:
      MARIADB_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
      MARIADB_DATABASE: gold
      MARIADB_USER: ${DB_USER}
      MARIADB_PASSWORD: ${DB_PASSWORD}
    volumes:
      - db_prod_data:/var/lib/mysql
    networks:
      - ocmanager_prod

  api:
    build:
      context: ./api
      dockerfile: Dockerfile
    restart: always
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
    ports:
      - "3001:3001"
    depends_on:
      - db
    networks:
      - ocmanager_prod

  web:
    build:
      context: ./web
      dockerfile: Dockerfile.prod
    restart: always
    ports:
      - "80:80"
    depends_on:
      - api
    networks:
      - ocmanager_prod

volumes:
  db_prod_data:

networks:
  ocmanager_prod:
```

Crear `web/Dockerfile.prod`:
```dockerfile
FROM node:20-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Desplegar:
```bash
docker compose -f docker-compose.prod.yml up -d
```

---

## Comandos Útiles

### Gestión de Base de Datos

```bash
# Crear nueva migración
cd api
npx prisma migrate dev --name nombre_migracion

# Ver estado de migraciones
npx prisma migrate status

# Resetear base de datos (CUIDADO: Borra todos los datos)
npx prisma migrate reset

# Abrir Prisma Studio (GUI para ver datos)
npx prisma studio
```

### Docker

```bash
# Ver logs de todos los servicios
docker compose logs -f

# Ver logs de un servicio específico
docker compose logs -f api

# Detener servicios
docker compose down

# Detener y eliminar volúmenes (CUIDADO: Borra datos)
docker compose down -v

# Reconstruir imágenes
docker compose build

# Reiniciar un servicio
docker compose restart api
```

### Desarrollo

```bash
# Lint y formato
cd api
npm run lint

cd ../web
npm run lint

# Tests
cd api
npm test

cd ../web
npm test

# Build solo de tipos TypeScript
cd api
npm run build

cd ../web
npm run build
```

---

## Variables de Entorno Importantes

### Backend (API)

| Variable | Descripción | Valor por defecto | Requerido |
|----------|-------------|-------------------|-----------|
| `DATABASE_URL` | URL de conexión a MySQL | - | Sí |
| `JWT_SECRET` | Secreto para firmar tokens JWT | - | Sí |
| `JWT_EXPIRES_IN` | Tiempo de expiración del token | `7d` | No |
| `NODE_ENV` | Entorno de ejecución | `development` | No |
| `API_PORT` | Puerto del servidor API | `3001` | No |
| `CORS_ORIGIN` | Origen permitido para CORS | `http://localhost:5173` | No |
| `MAX_FILE_SIZE` | Tamaño máximo de archivo (bytes) | `10485760` (10MB) | No |
| `UPLOAD_DIR` | Directorio para archivos subidos | `./uploads` | No |

### Frontend (Web)

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| `VITE_API_URL` | URL base de la API | `http://localhost:3001/api` |

---

## Solución de Problemas Comunes

### Error: "Cannot connect to database"

**Causa**: La base de datos no está disponible o las credenciales son incorrectas.

**Solución**:
```bash
# Verificar que MariaDB está corriendo
docker compose ps

# Ver logs de la base de datos
docker compose logs db

# Verificar conexión manual
mysql -h labsacme.com -P 9858 -u camilo -p gold
```

### Error: "Port 3001 is already in use"

**Causa**: Otro proceso está usando el puerto.

**Solución**:
```bash
# Ver qué proceso usa el puerto
lsof -i :3001

# Cambiar el puerto en .env
echo "API_PORT=3002" >> .env
```

### Error: "Prisma Client not generated"

**Causa**: No se ha generado el cliente de Prisma después de cambios en el schema.

**Solución**:
```bash
cd api
npx prisma generate
```

### Error: "CORS policy"

**Causa**: El frontend está intentando conectar desde un origen no permitido.

**Solución**:
```bash
# Actualizar CORS_ORIGIN en .env
echo "CORS_ORIGIN=http://localhost:5173" >> .env
# Reiniciar API
```

### Logs no aparecen

**Solución**:
```bash
# Ajustar nivel de logs en .env
echo "LOG_LEVEL=debug" >> .env
```

---

## Checklist de Despliegue a Producción

- [ ] Cambiar `JWT_SECRET` a un valor aleatorio seguro
- [ ] Configurar `NODE_ENV=production`
- [ ] Usar base de datos en servidor dedicado (no local)
- [ ] Configurar HTTPS/SSL
- [ ] Configurar dominio propio
- [ ] Configurar firewall y security groups
- [ ] Habilitar backups automáticos de base de datos
- [ ] Configurar monitoreo y alertas
- [ ] Implementar rate limiting más estricto
- [ ] Revisar permisos de archivos y directorios
- [ ] Configurar logs centralizados
- [ ] Implementar CI/CD pipeline
- [ ] Documentar proceso de rollback

---

## Contacto y Soporte

Para problemas o dudas:
- Email: soporte@orderflow.com
- Documentación: https://docs.orderflow.com
- Issues: https://github.com/yourorg/ocmanager2/issues
