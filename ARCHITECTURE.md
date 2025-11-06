# Arquitectura del Sistema OrderFlow

## Visión General

OrderFlow es una aplicación web full-stack diseñada con arquitectura de tres capas:

```
┌─────────────────┐
│   Frontend      │  React + Vite + Tailwind
│   (Web Client)  │  Puerto: 5173
└────────┬────────┘
         │ HTTP/HTTPS
         │ REST API
         ↓
┌─────────────────┐
│   Backend       │  Node.js + Express + TypeScript
│   (API Server)  │  Puerto: 3001
└────────┬────────┘
         │ Prisma ORM
         │ MySQL Protocol
         ↓
┌─────────────────┐
│   Database      │  MariaDB/MySQL
│   (Data Layer)  │  Puerto: 9858
└─────────────────┘
```

## Patrones de Diseño

### Backend

#### 1. **MVC (Model-View-Controller)**
- **Models**: Definidos con Prisma Schema
- **Views**: API JSON responses
- **Controllers**: Lógica de negocio en `/controllers`

#### 2. **Repository Pattern**
- Prisma Client actúa como capa de abstracción de datos
- Facilita testing con mocks

#### 3. **Middleware Chain**
- Autenticación JWT
- Validación de datos (Zod)
- Rate limiting
- Error handling global

#### 4. **DTOs (Data Transfer Objects)**
- Validación con Zod schemas
- Separación entre entidades de BD y respuestas API

### Frontend

#### 1. **Component-Based Architecture**
```
src/
├── components/
│   ├── ui/              # Componentes reutilizables (shadcn)
│   └── layouts/         # Layouts de página
├── pages/               # Páginas/vistas de la app
├── lib/
│   ├── api.ts          # Cliente HTTP centralizado
│   └── utils.ts        # Utilidades compartidas
└── store/              # Estado global (Zustand)
```

#### 2. **State Management**
- **Local State**: useState, useReducer
- **Global State**: Zustand (auth, user data)
- **Server State**: React Query (caché, sincronización)

#### 3. **Composition Pattern**
- Componentes pequeños y reutilizables
- Props drilling evitado con contextos y stores

## Flujo de Datos

### Autenticación

```
1. Usuario → Formulario Login
2. POST /api/auth/login → Backend
3. Backend valida credenciales
4. Backend genera JWT
5. JWT enviado en cookie httpOnly
6. Frontend guarda user data en Zustand
7. Requests subsecuentes incluyen JWT en header
```

### Carga de Órdenes desde CSV

```
1. Cliente selecciona archivo CSV/XLSX
2. Frontend → POST /api/oc/upload (multipart/form-data)
3. Backend parsea con library XLSX
4. Backend extrae headers y primeras filas
5. Backend responde con preview y headers
6. Frontend muestra UI de mapeo de columnas
7. Usuario mapea columnas (sku, cantidad, precio, etc.)
8. Frontend → POST /api/oc/:id/confirm con mapping
9. Backend valida y crea orden + items
10. Backend registra en audit_log
11. Frontend muestra orden creada
```

### Trazabilidad de Envíos

```
1. Admin marca OV como "enviada"
2. Frontend → POST /api/ov/:id/cambiar-estado
3. Backend valida transición de estado
4. Backend crea Envio automáticamente
5. Backend crea primer evento (preparando)
6. Frontend redirige a detalle de envío
7. Admin agrega eventos manualmente
8. Frontend → POST /api/envios/:id/eventos
9. Backend actualiza estado del envío
10. Cliente consulta timeline en tiempo real
```

## Base de Datos

### Diseño de Esquema

#### Entidades Principales

**users**
- Autenticación y autorización
- Relación 1:1 con clientes (opcional)
- Role-based access control

**clientes**
- Datos de empresa/persona
- Relación 1:N con órdenes

**productos**
- Catálogo de productos
- SKU único

**ordenes_compra**
- Órdenes recibidas de clientes
- Estados: recibida → en_proceso → enviada → finalizada
- Relación 1:N con items

**ordenes_venta**
- Órdenes generadas para cumplir OCs
- Puede vincularse a OC origen
- Relación 1:1 con envío

**envios**
- Trazabilidad de despachos
- Relación 1:N con eventos

**envio_eventos**
- Timeline de estados del envío
- Timestamp, ubicación, estado, comentario

**audit_logs**
- Registro de todas las operaciones críticas
- Incluye diff JSON para cambios

### Índices

```sql
-- Performance-critical indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_oc_codigo ON ordenes_compra(codigo_oc);
CREATE INDEX idx_oc_cliente ON ordenes_compra(cliente_id);
CREATE INDEX idx_oc_estado ON ordenes_compra(estado);
CREATE INDEX idx_ov_codigo ON ordenes_venta(codigo_ov);
CREATE INDEX idx_envio_numero ON envios(numero_envio);
CREATE INDEX idx_audit_created ON audit_logs(created_at);
```

## Seguridad

### Medidas Implementadas

1. **Autenticación**
   - JWT con expiración configurable
   - Cookies httpOnly (no accesibles desde JS)
   - Refresh token en cookie separada (opcional)

2. **Autorización**
   - Middleware RBAC (Role-Based Access Control)
   - Admin: acceso total
   - Cliente: solo sus datos

3. **Validación**
   - Zod schemas en todos los endpoints
   - Sanitización de inputs
   - Límite de tamaño de archivos

4. **Rate Limiting**
   - 5 intentos de login en 15 min
   - 10 uploads en 15 min
   - 100 requests generales en 15 min

5. **CORS**
   - Configurado solo para orígenes permitidos
   - Credentials habilitados

6. **Headers de Seguridad**
   - Helmet.js aplicado
   - CSP, X-Frame-Options, etc.

## Escalabilidad

### Estrategias

1. **Horizontal Scaling**
   - Backend stateless (JWT)
   - Load balancer (Nginx, AWS ALB)
   - Múltiples instancias de API

2. **Database**
   - Replica set para lecturas
   - Connection pooling con Prisma
   - Índices optimizados

3. **Caching**
   - React Query en frontend (5 min TTL)
   - Redis para sesiones (futuro)
   - CDN para assets estáticos

4. **File Storage**
   - Actualmente: sistema de archivos local
   - Futuro: S3-compatible (MinIO, AWS S3)

5. **Async Processing**
   - Futuro: Queue (BullMQ, RabbitMQ)
   - Para procesamiento de archivos grandes
   - Para envío de notificaciones

## Testing

### Backend

```
api/src/
├── __tests__/
│   ├── unit/
│   │   ├── services/
│   │   └── utils/
│   └── integration/
│       └── controllers/
```

- **Unit Tests**: Servicios, utilidades
- **Integration Tests**: Endpoints completos
- **Coverage Target**: >80%

### Frontend

```
web/src/
├── components/
│   └── __tests__/
├── pages/
│   └── __tests__/
└── lib/
    └── __tests__/
```

- **Component Tests**: React Testing Library
- **E2E**: Playwright (futuro)

## Monitoreo y Observabilidad

### Logging

- **Librería**: Pino
- **Niveles**: debug, info, warn, error
- **Formato**: JSON en producción
- **Pretty-print**: en desarrollo

### Métricas

- **Audit Logs**: Todas las operaciones críticas
- **API Response Times**: Header X-Response-Time
- **Error Tracking**: Console + futuros servicios (Sentry)

### Health Checks

```
GET /health
Response: {
  "status": "ok",
  "timestamp": "2024-11-06T..."
}
```

## Deployment

### Ambientes

1. **Development**
   - Docker Compose local
   - Hot reload habilitado
   - Debug logs

2. **Staging**
   - Docker Compose en servidor
   - Datos de prueba
   - Similar a producción

3. **Production**
   - Kubernetes / Docker Swarm
   - Auto-scaling
   - Backups automáticos
   - Monitoreo 24/7

### CI/CD Pipeline (Futuro)

```
┌──────────┐
│   Git    │
│   Push   │
└────┬─────┘
     │
     ↓
┌──────────┐
│  GitHub  │
│  Actions │
└────┬─────┘
     │
     ├─→ Run Tests
     ├─→ Build Images
     ├─→ Security Scan
     └─→ Deploy
```

## Mejoras Futuras

### Short Term
- [ ] Swagger/OpenAPI documentation
- [ ] Notificaciones por email
- [ ] Filtros avanzados en listados
- [ ] Exportar reportes a PDF

### Medium Term
- [ ] WebSockets para updates en tiempo real
- [ ] Dashboard con gráficos interactivos (Recharts)
- [ ] Sistema de notificaciones in-app
- [ ] Multi-tenancy

### Long Term
- [ ] Mobile app (React Native)
- [ ] Integración con carriers (DHL, FedEx APIs)
- [ ] ML para predicción de tiempos de entrega
- [ ] Blockchain para trazabilidad inmutable

---

**Documentado**: 2024-11-06  
**Versión**: 1.0.0
