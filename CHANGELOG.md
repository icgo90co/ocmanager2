# Changelog

All notable changes to OrderFlow will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-11-06

### Added

#### Backend
- Sistema completo de autenticación con JWT
- CRUD de clientes con validación
- CRUD de productos con búsqueda
- Gestión de órdenes de compra con estados
- Carga de órdenes desde archivos CSV/XLSX
- Mapeo inteligente de columnas en archivos
- Gestión de órdenes de venta
- Generación automática de OV desde OC
- Sistema de envíos con trazabilidad
- Timeline de eventos para envíos
- Sistema de auditoría completo (audit_logs)
- Rate limiting en endpoints críticos
- Logging estructurado con Pino
- Validación de datos con Zod
- Prisma como ORM
- Seeds de datos de ejemplo
- Middleware de autenticación y autorización
- Sistema de roles (admin/cliente)
- Health check endpoint

#### Frontend
- Página de login con autenticación
- Dashboard de administrador con KPIs
- Dashboard de cliente personalizado
- Gestión de órdenes de compra
- Gestión de órdenes de venta
- Vista de envíos y tracking
- Gestión de productos (admin)
- Gestión de clientes (admin)
- Componentes UI con shadcn/ui
- Estado global con Zustand
- Manejo de servidor state con React Query
- Diseño responsive con Tailwind CSS
- Protección de rutas privadas
- Sistema de badges de estado
- Formateo de moneda y fechas

#### Infraestructura
- Docker Compose para desarrollo
- Configuración de MariaDB/MySQL
- Scripts de inicio rápido
- Scripts de limpieza
- Variables de entorno configurables
- Estructura de monorepo

#### Documentación
- README completo con guía de inicio rápido
- INSTALL.md con instrucciones detalladas
- ARCHITECTURE.md con diseño del sistema
- Ejemplo de archivo CSV para órdenes
- Scripts bash documentados
- Comentarios en código

### Security
- JWT con cookies httpOnly
- CORS configurado correctamente
- Helmet.js para headers de seguridad
- Validación y sanitización de inputs
- Rate limiting contra ataques
- Separación de roles y permisos

### Database
- Schema completo con Prisma
- 11 entidades relacionadas
- Índices para performance
- Migraciones versionadas
- Seeds con datos realistas
- Audit trail en todas las operaciones críticas

## [Unreleased]

### Planned
- Notificaciones por email
- Exportar reportes a PDF
- Swagger/OpenAPI documentation
- WebSockets para updates en tiempo real
- Dashboard con gráficos (Recharts)
- Filtros avanzados en tablas
- Paginación server-side
- Tests unitarios y de integración
- CI/CD pipeline
- Multi-idioma (i18n)
- Tema oscuro
- Mobile app
- Integración con carriers externos
- ML para predicción de entregas

### Known Issues
- Falta implementación completa de páginas de OV, Envíos, Productos y Clientes
- Falta modal de confirmación en cambios de estado
- Falta vista detallada de órdenes con timeline
- Falta implementación de wizard para crear OV desde OC
- Falta mapeo de columnas en UI para upload de CSV
- Falta tests automatizados

## Guidelines para Contribuir

Al agregar cambios al CHANGELOG:

1. Agregar bajo `[Unreleased]` primero
2. Al hacer release, mover a versión nueva con fecha
3. Categorías válidas:
   - `Added` - nuevas features
   - `Changed` - cambios en funcionalidad existente
   - `Deprecated` - features que serán removidas
   - `Removed` - features removidas
   - `Fixed` - bug fixes
   - `Security` - mejoras de seguridad

---

Para más información, ver [README.md](README.md)
