// Test directo de la API de Gemini
require('dotenv').config({ path: '../.env' });
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGemini() {
  console.log('Testing Gemini API...');
  console.log('API Key:', process.env.GEMINI_API_KEY?.substring(0, 20) + '...');
  
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Probar diferentes modelos
    const modelsToTry = [
      'gemini-2.5-flash-preview-05-20',
      'gemini-2.5-pro-preview-03-25',
      'gemini-pro',
      'gemini-1.5-pro',
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
    }
    return false;
  }
}

testGemini();
