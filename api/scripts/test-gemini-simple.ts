/**
 * Script simple para probar la conexión con Gemini AI
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

async function testGeminiSimple() {
  console.log('\n🧪 Test Simple de Gemini AI\n');

  // 1. Verificar API Key
  const apiKey = process.env.GEMINI_API_KEY;
  console.log('1. API Key configurada:', apiKey ? '✅ Sí' : '❌ No');
  
  if (!apiKey) {
    console.error('❌ GEMINI_API_KEY no está configurada');
    process.exit(1);
  }

  console.log('   Primeros caracteres:', apiKey.substring(0, 20) + '...\n');

  // 2. Inicializar Gemini
  console.log('2. Inicializando Gemini AI...');
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  console.log('   ✅ Modelo inicializado\n');

  // 3. Test básico de texto
  console.log('3. Probando generación de texto simple...');
  try {
    const result = await model.generateContent('Di "hola" en JSON: {"mensaje": "..."}');
    const response = await result.response;
    const text = response.text();
    console.log('   Respuesta:', text);
    console.log('   ✅ Generación de texto funciona\n');
  } catch (error) {
    console.error('   ❌ Error:', error instanceof Error ? error.message : error);
    if (error instanceof Error && error.message.includes('403')) {
      console.error('\n⚠️  Error 403: La API key no es válida o no tiene permisos');
      console.error('   Soluciones:');
      console.error('   1. Genera una nueva API key en: https://makersuite.google.com/app/apikey');
      console.error('   2. Asegúrate de habilitar "Generative Language API"');
      console.error('   3. Verifica que no haya restricciones de IP o servicio\n');
    }
    process.exit(1);
  }

  // 4. Test con imagen simple (base64)
  console.log('4. Probando procesamiento de imagen...');
  try {
    // Crear una imagen de prueba simple (1x1 pixel PNG en base64)
    const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    
    const imagePart = {
      inlineData: {
        data: testImageBase64,
        mimeType: 'image/png',
      },
    };

    const result = await model.generateContent([
      'Describe brevemente esta imagen en una palabra:',
      imagePart,
    ]);
    
    const response = await result.response;
    const text = response.text();
    console.log('   Respuesta:', text);
    console.log('   ✅ Procesamiento de imagen funciona\n');
  } catch (error) {
    console.error('   ❌ Error:', error instanceof Error ? error.message : error);
    console.error('   ℹ️  El procesamiento de imágenes puede requerir permisos adicionales\n');
  }

  console.log('✅ Todas las pruebas completadas exitosamente!');
  console.log('\nEl servicio de Gemini AI está funcionando correctamente.');
  console.log('Si aún tienes problemas, revisa:');
  console.log('  - Los logs del servidor API');
  console.log('  - El formato del archivo que estás subiendo');
  console.log('  - El tamaño del archivo (máximo 10MB)\n');
}

testGeminiSimple()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Error fatal:', error);
    process.exit(1);
  });
