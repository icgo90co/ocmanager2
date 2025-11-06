# Despliegue en Easypanel

## Configuración de Variables de Entorno

### Para el servicio API

**IMPORTANTE**: Configura estas variables en la sección de Environment del servicio API en Easypanel:

```env
NODE_ENV=production
DATABASE_URL=mysql://camilo:Indiana%40%4090081010@labsacme.com:9858/gold
JWT_SECRET=tu-secreto-jwt-aqui
CORS_ORIGIN=https://flow.labsacme.com
API_PORT=3001
```

### Para el servicio Web

```env
VITE_API_URL=https://api1.labsacme.com/api
```

## Configuración de Dominios

### Dominio Frontend
- Dominio: `flow.labsacme.com`
- Puerto del contenedor: `5173`
- Servicio: `web`

### Dominio API
- Dominio: `api1.labsacme.com`
- Puerto del contenedor: `3001`
- Servicio: `api`

## Verificación de CORS

Después del despliegue, verifica que CORS esté configurado correctamente:

1. Accede a: `https://api1.labsacme.com/api/debug/cors`
2. Deberías ver:
```json
{
  "corsOrigin": "https://flow.labsacme.com",
  "nodeEnv": "production",
  "requestOrigin": "https://flow.labsacme.com",
  "allowedOrigin": "https://flow.labsacme.com"
}
```

## Troubleshooting CORS

Si recibes errores CORS:

### 1. Verificar que la variable de entorno está configurada
```bash
# En Easypanel, revisa Environment del servicio API
CORS_ORIGIN=https://flow.labsacme.com  # ← Debe estar exactamente así
```

### 2. Verificar logs del API
```bash
# Busca esta línea en los logs del contenedor API:
🔐 CORS configured for origin: https://flow.labsacme.com
```

### 3. Probar endpoint de debug
```bash
curl https://api1.labsacme.com/api/debug/cors
```

### 4. Verificar headers en el navegador
Abre DevTools → Network → Selecciona la petición fallida → Headers:
- Debería tener `Access-Control-Allow-Origin: https://flow.labsacme.com`
- Debería tener `Access-Control-Allow-Credentials: true`

## Comandos Post-Deploy

Después de cada despliegue exitoso, ejecuta en el contenedor API:

```bash
# 1. Ejecutar migraciones
npx prisma migrate deploy

# 2. Poblar datos iniciales (solo primera vez)
npm run seed
```

## Checklist de Despliegue

- [ ] Variables de entorno configuradas en Easypanel (API)
- [ ] Variables de entorno configuradas en Easypanel (Web)
- [ ] Dominios configurados correctamente
- [ ] Servicio API construido y corriendo
- [ ] Servicio Web construido y corriendo
- [ ] Migraciones ejecutadas
- [ ] Seed ejecutado (primera vez)
- [ ] Endpoint /api/debug/cors responde correctamente
- [ ] Login funciona desde https://flow.labsacme.com

## Credenciales por Defecto

Una vez desplegado, puedes acceder con:

**Admin**:
- Email: admin@ocmanager.com
- Password: admin123

**Cliente**:
- Email: cliente@acme.com
- Password: cliente123

---

**Nota**: Si cambias el dominio del frontend, recuerda actualizar `CORS_ORIGIN` en las variables de entorno del API y redesplegar.
