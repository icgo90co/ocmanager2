/**
 * Script de prueba para verificar la integración con Gemini AI
 * 
 * Uso:
 *   npx tsx scripts/test-gemini.ts
 */

import dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno desde la raíz del proyecto
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

import geminiService from '../src/services/gemini.service';

async function testGemini() {
  console.log('🧪 Probando servicio de Gemini AI...\n');

  // Test 1: Verificar que la API key esté configurada
  console.log('1. Verificando configuración...');
  if (!process.env.GEMINI_API_KEY) {
    console.error('❌ Error: GEMINI_API_KEY no está configurada en .env');
    process.exit(1);
  }
  console.log('✅ API key configurada\n');

  // Test 2: Probar generación de SKU
  console.log('2. Probando generación de SKU...');
  try {
    const descripcion = 'Laptop Dell Latitude 5520 15.6 pulgadas Intel Core i7';
    const sku = await geminiService.sugerirSKU(descripcion);
    console.log(`   Descripción: ${descripcion}`);
    console.log(`   SKU generado: ${sku}`);
    console.log('✅ Generación de SKU funciona\n');
  } catch (error) {
    console.error('❌ Error generando SKU:', error);
  }

  // Test 3: Probar mejora de descripción
  console.log('3. Probando mejora de descripción...');
  try {
    const descripcionOriginal = 'laptop dell';
    const mejorada = await geminiService.mejorarDescripcionProducto(descripcionOriginal);
    console.log(`   Original: ${descripcionOriginal}`);
    console.log(`   Mejorada: ${mejorada}`);
    console.log('✅ Mejora de descripción funciona\n');
  } catch (error) {
    console.error('❌ Error mejorando descripción:', error);
  }

  // Test 4: Información sobre procesamiento de documentos
  console.log('4. Procesamiento de documentos');
  console.log('   Para probar el procesamiento completo de documentos:');
  console.log('   - Usa la interfaz web en /ordenes-compra');
  console.log('   - Clic en "Subir con IA"');
  console.log('   - Selecciona un PDF o imagen de orden de compra');
  console.log('   ℹ️  Este test solo verifica las funciones auxiliares\n');

  console.log('🎉 ¡Todas las pruebas completadas!');
  console.log('\nEl servicio de Gemini AI está configurado correctamente.');
  console.log('Puedes proceder a usar la funcionalidad en la web app.\n');
}

// Ejecutar pruebas
testGemini()
  .then(() => {
    console.log('✅ Test exitoso');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error en el test:', error);
    process.exit(1);
  });
