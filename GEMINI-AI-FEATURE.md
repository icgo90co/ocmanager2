# Procesamiento de Órdenes de Compra con IA Gemini

## Descripción General

El sistema ahora cuenta con capacidad de procesamiento inteligente de documentos usando **Google Gemini AI**. Esta funcionalidad permite a los usuarios subir documentos de órdenes de compra en múltiples formatos (PDF, imágenes, Excel, CSV) y el sistema extraerá automáticamente toda la información relevante.

## Características

### 🤖 Extracción Automática de Datos

La IA puede identificar y extraer:

- **Número de Orden**: OC, PO, Order Number, etc.
- **Información del Cliente**: 
  - Nombre de la empresa
  - NIT o identificación fiscal
  - Email de contacto
  - Teléfono
  - Dirección completa
- **Productos**:
  - SKU o código del producto
  - Descripción detallada
  - Cantidad
  - Precio unitario
  - Subtotal por producto
- **Valores Financieros**:
  - Subtotal de la orden
  - Impuestos (IVA u otros)
  - Total final
  - Moneda (COP, USD, EUR, etc.)
- **Datos Adicionales**:
  - Fecha del documento
  - Observaciones o términos especiales

### 📝 Interfaz de Edición

Después de la extracción automática, el usuario puede:

1. **Revisar** toda la información extraída
2. **Editar** cualquier campo si la IA cometió errores
3. **Seleccionar** el cliente correcto de la base de datos
4. **Ajustar** cantidades y precios si es necesario
5. **Confirmar** y crear la orden con un solo clic

### 🔍 Características Inteligentes

- **Búsqueda automática de clientes**: Si la IA detecta un NIT, busca automáticamente el cliente en la base de datos
- **Mapeo de productos**: Intenta vincular los SKUs detectados con productos existentes en el catálogo
- **Generación de SKUs**: Si un producto no tiene SKU, la IA puede sugerir uno basado en la descripción
- **Cálculo automático**: Recalcula subtotales y totales en tiempo real al editar
- **Validación de datos**: Verifica que todos los campos obligatorios estén completos

## Formatos Soportados

### Documentos Estructurados
- **PDF**: Facturas, órdenes de compra formales
- **Excel/CSV**: Listados de productos con columnas definidas

### Imágenes
- **JPG/PNG**: Fotografías o escaneos de documentos físicos

## Configuración

### Variable de Entorno

El token de API de Gemini se configura en el archivo `.env`:

```env
GEMINI_API_KEY="AIzaSyC--qVr8uc7OmQibgXFRFIF7mpBmhIwq3I"
```

### Backend

**Servicio de IA**: `/api/src/services/gemini.service.ts`
- Inicializa el modelo Gemini Flash (rápido y económico)
- Procesa documentos y extrae información estructurada
- Incluye funciones auxiliares para mejorar descripciones y generar SKUs

**Controlador OC**: `/api/src/controllers/oc.controller.ts`
- Endpoint `POST /api/oc/upload` con parámetro `useAI=true`
- Endpoint `POST /api/oc/confirm` para confirmar órdenes procesadas con IA

### Frontend

**Componente**: `/web/src/components/OrdenCompraUploadIA.tsx`
- Interfaz moderna con indicadores de progreso
- Formulario de edición completo con todos los campos
- Validaciones en tiempo real
- Cálculo automático de totales

**Integración**: `/web/src/pages/OrdenesCompraPage.tsx`
- Botón "Subir con IA" destacado con icono de sparkles (✨)
- Diseño visual diferenciado con gradiente azul/morado

## Flujo de Uso

### Para Usuarios

1. **Clic en "Subir con IA"** en la página de Órdenes de Compra
2. **Seleccionar archivo** (PDF, imagen, Excel o CSV)
3. **Esperar procesamiento** (5-15 segundos típicamente)
4. **Revisar datos extraídos** en el formulario interactivo
5. **Editar si es necesario** cualquier campo incorrecto
6. **Seleccionar cliente** de la lista si no se detectó automáticamente
7. **Confirmar y crear orden**

### Para Administradores

Adicional al flujo de usuario:
- Ver todas las órdenes creadas con IA (origen = 'ai')
- Auditar el proceso en los logs del sistema
- Monitorear la calidad de las extracciones

## Tecnologías Utilizadas

- **Google Gemini 1.5 Flash**: Modelo de IA multimodal (texto + imágenes)
- **pdf-parse**: Extracción de texto de PDFs
- **React Query**: Gestión de estado asíncrono en frontend
- **Zod**: Validación de esquemas de datos
- **Prisma**: ORM con soporte para enum 'ai' en OrigenOrden

## Ventajas

✅ **Ahorro de tiempo**: De 5-10 minutos a 30 segundos por orden  
✅ **Reducción de errores**: Menos errores de transcripción manual  
✅ **Múltiples formatos**: Acepta cualquier tipo de documento  
✅ **Edición flexible**: Control total sobre los datos antes de guardar  
✅ **Trazabilidad**: Auditoría completa del proceso  
✅ **Escalabilidad**: Puede procesar cientos de documentos rápidamente  

## Limitaciones y Consideraciones

⚠️ **Calidad del documento**: Documentos muy borrosos o con mala calidad pueden dar resultados inexactos  
⚠️ **Idioma**: Optimizado para español, pero funciona en otros idiomas  
⚠️ **Formatos personalizados**: Documentos con formatos muy inusuales pueden requerir ajustes manuales  
⚠️ **Costo de API**: Cada procesamiento consume créditos de la API de Gemini  
⚠️ **Conexión a internet**: Requiere conectividad estable para comunicarse con la API  

## Mejoras Futuras

🔮 **En desarrollo**:
- Entrenamiento con ejemplos propios para mejorar precisión
- Procesamiento por lotes (múltiples archivos a la vez)
- Detección de duplicados automática
- Sugerencias de precios basadas en históricos
- OCR mejorado para documentos manuscritos
- Integración con WhatsApp para recibir órdenes por chat

## Ejemplos de Uso

### Ejemplo 1: PDF Formal

Subir una factura en PDF genera:
```json
{
  "numeroOrden": "OC-2024-001234",
  "cliente": {
    "nombre": "Acme Corporation S.A.S.",
    "nit": "900123456-7",
    "email": "compras@acmecorp.com"
  },
  "productos": [
    {
      "sku": "PROD-001",
      "descripcion": "Laptop Dell Latitude",
      "cantidad": 10,
      "precioUnitario": 3500000
    }
  ],
  "total": 82110000,
  "moneda": "COP"
}
```

### Ejemplo 2: Fotografía de Documento

Una foto tomada con celular de un pedido escrito puede ser procesada igual de efectivamente.

### Ejemplo 3: Excel con Columnas Personalizadas

El sistema detecta automáticamente las columnas relevantes y extrae los datos.

## Soporte y Contacto

Para reportar problemas o sugerir mejoras en la funcionalidad de IA:
- Crear un issue en el repositorio
- Contactar al equipo de desarrollo
- Revisar los logs en `/api/logs` para debugging

---

**Última actualización**: Noviembre 2024  
**Versión**: 2.0 - Con IA Gemini
