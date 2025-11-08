// Test directo de la API de Gemini
require('dotenv').config({ path: '../.env' });
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testNetwork() {
  console.log('\n🌐 Probando conectividad de red...');
  try {
    const https = require('https');
    const response = await new Promise((resolve, reject) => {
      https.get('https://generativelanguage.googleapis.com/', (res) => {
        resolve(res.statusCode);
      }).on('error', reject);
    });
    console.log(`✅ Conectividad OK (status: ${response})`);
    return true;
  } catch (error) {
    console.error(`❌ Error de red: ${error.message}`);
    console.error('   El contenedor Docker puede no tener acceso a internet');
    console.error('   o hay un firewall bloqueando la conexión');
    return false;
  }
}

async function testGemini() {
  console.log('Testing Gemini API...');
  console.log('API Key:', process.env.GEMINI_API_KEY?.substring(0, 20) + '...');
  
  const hasNetwork = await testNetwork();
  if (!hasNetwork) {
    console.error('\n⚠️  Problema de red detectado. Verifica:');
    console.error('   1. El contenedor tiene acceso a internet');
    console.error('   2. No hay firewall bloqueando googleapis.com');
    console.error('   3. El DNS está configurado correctamente');
    return false;
  }
  
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Probar diferentes modelos
    const modelsToTry = [
      'gemini-pro',
      'gemini-1.5-pro',
      'gemini-1.5-flash',
      'gemini-2.5-flash-preview-05-20',
    ];
    
    for (const modelName of modelsToTry) {
      console.log(`\nProbando modelo: ${modelName}...`);
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent('Responde solo con "OK"');
        const response = await result.response;
        const text = response.text();
        console.log(`✅ Funciona! Respuesta: ${text}`);
        console.log(`\n🎉 Usa este modelo: ${modelName}`);
        return modelName;
      } catch (error) {
        console.log(`❌ ${modelName} no funciona: ${error.message.split('\n')[0]}`);
      }
    }
    
    throw new Error('Ningún modelo funciona');
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('403')) {
      console.error('La API key no tiene permisos o es inválida');
    } else if (error.message.includes('404')) {
      console.error('El modelo no está disponible');
    } else if (error.message.includes('fetch failed')) {
      console.error('Error de red - el contenedor no puede conectarse a Google API');
    }
    return false;
  }
}

testGemini();
