import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
const pdfParse = require('pdf-parse');
import { logger } from '../utils/logger';

// Inicializar Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface ExtractedOCData {
  numeroOrden?: string;
  cliente?: {
    nombre?: string;
    nit?: string;
    email?: string;
    telefono?: string;
    direccion?: string;
  };
  productos: Array<{
    sku?: string;
    descripcion: string;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
  }>;
  subtotal?: number;
  impuestos?: number;
  total: number;
  moneda?: string;
  fecha?: string;
  observaciones?: string;
}

export class GeminiService {
  private model;

  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      logger.error('GEMINI_API_KEY no está configurada');
      throw new Error('GEMINI_API_KEY no está configurada en las variables de entorno');
    }
    // Usar gemini-2.5-flash-preview que es el modelo disponible más rápido y económico
    this.model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-preview-05-20' });
    logger.info('Servicio de Gemini AI inicializado correctamente con modelo gemini-2.5-flash');
  }

  /**
   * Procesa un archivo (PDF o imagen) y extrae información de la orden de compra
   */
  async procesarOrdenCompra(filePath: string, mimeType: string): Promise<ExtractedOCData> {
    try {
      logger.info(`Procesando archivo con Gemini AI: ${filePath}, tipo: ${mimeType}`);

      let contenidoTexto = '';

      // Si es PDF, extraer texto primero
      if (mimeType === 'application/pdf') {
        try {
          const dataBuffer = fs.readFileSync(filePath);
          const pdfData = await pdfParse(dataBuffer);
          contenidoTexto = pdfData.text;
          logger.info(`Texto extraído del PDF (${contenidoTexto.length} caracteres)`);
        } catch (pdfError) {
          logger.warn({ error: pdfError }, 'Error extrayendo texto del PDF, continuando con OCR visual');
          contenidoTexto = '';
        }
      }

      // Preparar el archivo para Gemini
      const fileData = fs.readFileSync(filePath);
      const base64Data = fileData.toString('base64');

      const imagePart = {
        inlineData: {
          data: base64Data,
          mimeType: mimeType,
        },
      };

      // Prompt optimizado para extraer información estructurada
      const prompt = `
Eres un experto en procesamiento de documentos comerciales. Analiza este documento de orden de compra y extrae TODA la información relevante.

${contenidoTexto ? `\n\nTexto del documento:\n${contenidoTexto}\n\n` : ''}

Extrae la siguiente información en formato JSON válido (sin markdown, solo JSON puro):

{
  "numeroOrden": "Número de la orden de compra (OC, PO, Order #, etc.)",
  "cliente": {
    "nombre": "Nombre de la empresa cliente",
    "nit": "NIT o identificación fiscal",
    "email": "Email de contacto",
    "telefono": "Teléfono de contacto",
    "direccion": "Dirección completa"
  },
  "productos": [
    {
      "sku": "Código/SKU del producto",
      "descripcion": "Descripción del producto",
      "cantidad": número,
      "precioUnitario": número,
      "subtotal": número
    }
  ],
  "subtotal": número (suma de productos antes de impuestos),
  "impuestos": número (IVA u otros impuestos),
  "total": número (monto total final),
  "moneda": "COP, USD, EUR, etc.",
  "fecha": "Fecha del documento en formato YYYY-MM-DD",
  "observaciones": "Notas adicionales o términos importantes"
}

IMPORTANTE:
- Si un campo no está presente, usa null
- Los números deben ser numéricos, sin símbolos de moneda
- La cantidad debe ser un número entero
- Los precios deben ser números decimales
- Calcula el subtotal de cada producto (cantidad × precioUnitario)
- Identifica correctamente el cliente incluso si aparece como "Bill to", "Cliente", "Customer", etc.
- Busca el número de orden en campos como "OC", "PO", "Order Number", "Orden #", etc.
- Si hay múltiples productos en una tabla, extrae TODOS
- Responde SOLO con el JSON, sin explicaciones adicionales
`;

      // Llamar a Gemini AI
      logger.info('Llamando a la API de Gemini...');
      const result = await this.model.generateContent([prompt, imagePart]);
      const response = await result.response;
      const text = response.text();

      logger.info(`Respuesta de Gemini AI recibida (${text.length} caracteres)`);
      logger.debug(`Respuesta completa: ${text.substring(0, 500)}...`);

      // Limpiar y parsear la respuesta
      let jsonText = text.trim();
      
      // Remover markdown code blocks si existen
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      
      // Parsear JSON
      let extractedData: ExtractedOCData;
      try {
        extractedData = JSON.parse(jsonText);
      } catch (parseError) {
        logger.error({ error: parseError, text: jsonText.substring(0, 200) }, 'Error parseando respuesta JSON de Gemini');
        throw new Error(`Error parseando respuesta de IA: ${parseError instanceof Error ? parseError.message : 'JSON inválido'}`);
      }

      // Validar que al menos tengamos productos
      if (!extractedData.productos || extractedData.productos.length === 0) {
        logger.error('No se encontraron productos en la respuesta de Gemini');
        throw new Error('No se pudieron extraer productos del documento');
      }

      logger.info(`Datos validados: ${extractedData.productos.length} productos encontrados`);

      // Calcular totales si faltan
      if (!extractedData.subtotal) {
        extractedData.subtotal = extractedData.productos.reduce(
          (sum, p) => sum + (p.subtotal || p.cantidad * p.precioUnitario),
          0
        );
      }

      if (!extractedData.total) {
        extractedData.total = extractedData.subtotal + (extractedData.impuestos || 0);
      }

      // Valores por defecto
      if (!extractedData.moneda) {
        extractedData.moneda = 'COP';
      }

      logger.info(`Datos extraídos exitosamente: ${extractedData.productos.length} productos, total: ${extractedData.total}`);

      return extractedData;
    } catch (error) {
      // Log detallado del error
      if (error instanceof Error) {
        logger.error({ 
          error: error.message, 
          stack: error.stack,
          name: error.name 
        }, 'Error procesando archivo con Gemini AI');
        
        // Errores específicos de la API de Google
        if (error.message.includes('403') || error.message.includes('Forbidden')) {
          throw new Error('API Key de Gemini inválida o sin permisos. Verifica la configuración en GEMINI_API_KEY.');
        } else if (error.message.includes('429') || error.message.includes('quota')) {
          throw new Error('Límite de uso de la API de Gemini excedido. Intenta más tarde.');
        } else if (error.message.includes('400') || error.message.includes('Bad Request')) {
          throw new Error('El archivo no pudo ser procesado por Gemini. Intenta con otro formato.');
        } else {
          throw new Error(`Error al procesar el documento: ${error.message}`);
        }
      } else {
        logger.error({ error }, 'Error desconocido procesando archivo con Gemini AI');
        throw new Error('Error desconocido al procesar el documento. Revisa los logs del servidor.');
      }
    }
  }

  /**
   * Mejora la descripción de un producto usando IA
   */
  async mejorarDescripcionProducto(descripcionActual: string): Promise<string> {
    try {
      const prompt = `
Mejora la siguiente descripción de producto haciéndola más clara y profesional, pero mantén la información técnica:

"${descripcionActual}"

Responde solo con la descripción mejorada, sin explicaciones adicionales.
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (error) {
      logger.error(`Error mejorando descripción: ${error}`);
      return descripcionActual; // Retornar original si falla
    }
  }

  /**
   * Sugiere un SKU basado en la descripción del producto
   */
  async sugerirSKU(descripcion: string): Promise<string> {
    try {
      const prompt = `
Genera un SKU corto y descriptivo (máximo 20 caracteres) para este producto:

"${descripcion}"

El SKU debe ser alfanumérico, en mayúsculas, sin espacios ni caracteres especiales.
Responde SOLO con el SKU, sin explicaciones.
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
    } catch (error) {
      logger.error(`Error generando SKU: ${error}`);
      return 'PROD-' + Date.now().toString().slice(-8);
    }
  }
}

export default new GeminiService();
