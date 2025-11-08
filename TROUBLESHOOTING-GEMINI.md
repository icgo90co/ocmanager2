# ⚠️ Troubleshooting: Configuración de Gemini AI

## Error 403: Method doesn't allow unregistered callers

Si recibes este error al probar Gemini AI:

```
[403 Forbidden] Method doesn't allow unregistered callers (callers without established identity)
```

### Posibles Causas

1. **API Key inválida o expirada**
   - Verifica que la API key esté correctamente copiada
   - No debe tener espacios al inicio o final
   - Debe incluir el prefijo completo

2. **Restricciones de la API Key**
   - La key puede estar restringida a ciertas IPs
   - Puede estar restringida a ciertos servicios
   - Puede haber alcanzado límites de uso

3. **Modelo no disponible**
   - El modelo `gemini-1.5-flash` puede no estar disponible en tu región
   - Intenta con `gemini-pro` o `gemini-1.5-pro`

### Soluciones

#### 1. Verificar la API Key

```bash
# En el archivo .env
GEMINI_API_KEY="AIzaSyC--qVr8uc7OmQibgXFRFIF7mpBmhIwq3I"
```

**IMPORTANTE**: Asegúrate de que:
- No haya espacios antes o después de las comillas
- La key esté completa
- No haya caracteres ocultos

#### 2. Generar una Nueva API Key

1. Ve a [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Inicia sesión con tu cuenta de Google
3. Crea una nueva API key
4. Copia la key completa
5. Reemplaza en `.env`:

```bash
GEMINI_API_KEY="TU_NUEVA_KEY_AQUI"
```

#### 3. Configurar Restricciones de la API Key

En la [Consola de Google Cloud](https://console.cloud.google.com/apis/credentials):

1. Selecciona tu proyecto
2. Ve a "Credenciales"
3. Encuentra tu API key
4. Edita las restricciones:
   - **Restricciones de aplicación**: Ninguna (para desarrollo)
   - **Restricciones de API**: Asegúrate de que "Generative Language API" esté habilitada

#### 4. Cambiar el Modelo

Si el problema persiste, edita `/api/src/services/gemini.service.ts`:

```typescript
// El modelo actual (actualizado Noviembre 2024):
this.model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-preview-05-20' });

// Alternativas si no funciona:
// this.model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro-preview-03-25' });
// this.model = genAI.getGenerativeModel({ model: 'gemini-pro' });
```

**Nota**: Los modelos de Gemini cambian frecuentemente. Verifica los modelos disponibles en:
```bash
curl "https://generativelanguage.googleapis.com/v1beta/models?key=TU_API_KEY"
```

#### 5. Verificar Cuotas y Límites

1. Ve a [Google AI Studio - Quotas](https://makersuite.google.com/app/prompts)
2. Revisa que no hayas excedido los límites gratuitos:
   - 60 requests por minuto
   - 1,500 requests por día (gratis)

#### 6. Habilitar la API

En [Google Cloud Console](https://console.cloud.google.com/):

1. Busca "Generative Language API"
2. Asegúrate de que esté habilitada
3. Si no lo está, haz clic en "Habilitar"

### Testing Paso a Paso

1. **Test básico de conectividad**:

```bash
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=TU_API_KEY" \
  -H 'Content-Type: application/json' \
  -X POST \
  -d '{"contents":[{"parts":[{"text":"Hola"}]}]}'
```

2. **Test desde Node.js**:

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI("TU_API_KEY");
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

const result = await model.generateContent("Hola");
const response = await result.response;
console.log(response.text());
```

3. **Test con nuestro script**:

```bash
cd /workspaces/ocmanager2/api
npm run test:gemini
```

### Solución Temporal: Deshabilitar IA

Si no puedes resolver el problema de inmediato, puedes:

1. **Comentar el uso de IA en el frontend**:

```typescript
// En OrdenesCompraPage.tsx
// Comentar o eliminar el botón "Subir con IA"
```

2. **Usar el método tradicional**:
   - Subir archivos CSV/XLSX sin IA
   - Mapear columnas manualmente
   - Funciona igual de bien, solo toma más tiempo

### Documentación Oficial

- [Gemini API Quickstart](https://ai.google.dev/tutorials/setup)
- [Get API Key](https://makersuite.google.com/app/apikey)
- [API Reference](https://ai.google.dev/api/rest/v1/models)
- [Pricing](https://ai.google.dev/pricing)

### Contacto de Soporte

Si ninguna solución funciona:

1. Revisa la [documentación oficial](https://ai.google.dev/)
2. Busca en [Stack Overflow](https://stackoverflow.com/questions/tagged/google-gemini)
3. Abre un issue en el [repositorio oficial](https://github.com/google/generative-ai-js)

---

## Notas Adicionales

### Costos

Gemini tiene un tier gratuito generoso:
- **Gemini 1.5 Flash**: Gratis hasta 1,500 requests/día
- **Gemini 1.5 Pro**: Gratis hasta 50 requests/día

### Alternativas

Si Gemini no funciona, considera:
- **OpenAI GPT-4 Vision**: Excelente para OCR
- **Azure Document Intelligence**: Especializado en documentos
- **AWS Textract**: Para extracción de tablas
- **Claude 3**: Multimodal como Gemini

### Privacidad

Ten en cuenta que al usar Gemini:
- Los documentos se envían a servidores de Google
- Google puede usar los datos para mejorar sus modelos
- Lee los [términos de servicio](https://ai.google.dev/terms)

Para datos sensibles, considera:
- Usar modelos locales (Ollama, LLaMA)
- Implementar OCR tradicional (Tesseract)
- Usar servicios con garantías de privacidad

---

**Última actualización**: Noviembre 2024
