# OrderFlow - Sistema de Gestión de Órdenes y Envíos

Sistema completo de gestión de órdenes de compra, órdenes de venta y seguimiento de envíos con panel de administración y cliente.

## 🚀 Características Principales

- **Gestión de Órdenes de Compra (OC)**: Creación manual o mediante carga de archivos CSV/XLSX con mapeo inteligente de columnas
- **Gestión de Órdenes de Venta (OV)**: Generación automática desde OC o creación manual
- **Seguimiento de Envíos**: Trazabilidad manual de eventos con timeline visual
- **Panel de Administración**: Dashboard con KPIs, control total y sistema de auditoría
- **Panel de Cliente**: Vista personalizada de órdenes y seguimiento de envíos

## 🏗️ Stack Tecnológico

**Backend**: Node.js 20 + TypeScript + Express + Prisma + MariaDB/MySQL + JWT + Zod + Pino  
**Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui + Zustand + React Query  
**Infraestructura**: Docker + Docker Compose

## 🔧 Instalación Rápida

```bash
# 1. Clonar repositorio
git clone <repository-url>
cd ocmanager2

# 2. Configurar variables de entorno
cp .env.example .env

# 3. Iniciar con Docker
docker compose up -d

# 4. Ejecutar migraciones y seed
docker compose exec api sh
npx prisma migrate deploy
npm run seed
```

**Acceso**: Frontend en http://localhost:5173 | API en http://localhost:3001

## 🔑 Credenciales

**Admin**: admin@ocmanager.com / admin123  
**Cliente**: cliente@acme.com / cliente123

## 📚 Uso

### Cargar Órdenes desde CSV

```csv
sku,cantidad,precio_unitario,descripcion
PROD-001,5,2500000,Laptop Dell Inspiron 15
PROD-002,10,350000,Mouse Logitech MX Master 3
```

Ver ejemplo completo en: `examples/sample-orden-compra.csv`

### Flujo Completo

1. Cliente/Admin carga OC desde CSV → Sistema mapea columnas
2. Admin genera OV desde la OC → Ajusta ítems si necesario
3. Admin marca OV como "enviada" → Sistema crea Envío automáticamente
4. Admin agrega eventos al envío (ubicación, estado, comentarios)
5. Cliente ve timeline de eventos en tiempo real

## 🔌 Principales Endpoints

```
POST   /api/auth/login
GET    /api/oc                  # Listar órdenes de compra
POST   /api/oc/upload           # Subir archivo CSV/XLSX
POST   /api/ov/desde-oc/:ocId   # Generar OV desde OC
GET    /api/envios/:id          # Detalle de envío con eventos
POST   /api/envios/:id/eventos  # Agregar evento a envío
```

## 📁 Estructura

```
ocmanager2/
├── api/                 # Backend (Express + Prisma)
│   ├── prisma/schema.prisma
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   └── seed.ts
│   └── package.json
├── web/                 # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── lib/api.ts
│   │   └── store/
│   └── package.json
├── docker-compose.yml
└── README.md
```

## 🗂️ Modelo de Datos

```
users → clientes → ordenes_compra → ordenes_venta → envios → envio_eventos
                         ↓                ↓
                    oc_items         ov_items → productos
```

## 🔐 Seguridad

- JWT + cookies httpOnly
- Rate limiting
- Validación con Zod
- Sistema de roles (admin/cliente)
- Audit logs completos

## 📦 Scripts Disponibles

```bash
npm run dev              # Dev completo (API + Web)
npm run build            # Build producción
npm run migrate          # Ejecutar migraciones
npm run seed             # Poblar datos de ejemplo
npm test                 # Ejecutar tests
```

## 🐛 Troubleshooting

```bash
# Ver logs
docker compose logs -f

# Regenerar Prisma client
cd api && npx prisma generate

# Reiniciar servicios
docker compose restart
```

## 📄 Licencia

MIT

---

**OrderFlow** © 2024 - Sistema de gestión de órdenes y envíos