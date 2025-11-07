const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const https = require('https');

const API_URL = 'https://api1.labsacme.com/api';

// Ignorar certificados autofirmados
const httpsAgent = new https.Agent({  
  rejectUnauthorized: false
});

async function testAPI() {
  console.log('\n🔍 Probando conexión a la API en producción...\n');
  
  try {
    // 1. Test health endpoint
    console.log('1. Verificando health endpoint...');
    const health = await axios.get(`${API_URL.replace('/api', '')}/health`, { httpsAgent });
    console.log('   ✅ Health:', health.data);

    // 2. Login como admin
    console.log('\n2. Intentando login como admin...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@ocmanager.com',
      password: 'admin123'
    }, { httpsAgent });
    console.log('   ✅ Login exitoso');
    const token = loginRes.data.data.token;
    console.log('   Token:', token.substring(0, 30) + '...');

    // 3. Obtener órdenes de compra
    console.log('\n3. Obteniendo órdenes de compra...');
    const ocRes = await axios.get(`${API_URL}/oc`, {
      headers: { Authorization: `Bearer ${token}` },
      httpsAgent
    });
    console.log('   ✅ Órdenes de Compra:', ocRes.data.data.length);
    ocRes.data.data.forEach(oc => {
      console.log(`      - ${oc.codigoOc}: ${oc.estado} (Total: ${oc.total})`);
    });

    // 4. Obtener órdenes de venta
    console.log('\n4. Obteniendo órdenes de venta...');
    const ovRes = await axios.get(`${API_URL}/ov`, {
      headers: { Authorization: `Bearer ${token}` },
      httpsAgent
    });
    console.log('   ✅ Órdenes de Venta:', ovRes.data.data.length);
    ovRes.data.data.forEach(ov => {
      console.log(`      - ${ov.codigoOv}: ${ov.estado} (Total: ${ov.total}, Envío: ${ov.envio ? 'Sí' : 'No'})`);
    });

    // 5. Obtener envíos
    console.log('\n5. Obteniendo envíos...');
    const enviosRes = await axios.get(`${API_URL}/envios`, {
      headers: { Authorization: `Bearer ${token}` },
      httpsAgent
    });
    console.log('   ✅ Envíos:', enviosRes.data.data.length);
    enviosRes.data.data.forEach(envio => {
      console.log(`      - ${envio.numeroEnvio}: ${envio.estadoEnvio} (Carrier: ${envio.carrier || 'N/A'})`);
    });

    console.log('\n✅ ¡Todo funcionando correctamente!\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      console.error('   → Las credenciales no coinciden o el usuario no existe en producción');
      console.error('   → Puede que necesites ejecutar el seed en producción');
    }
    process.exit(1);
  }
}

async function checkLocalDB() {
  console.log('\n📊 Verificando base de datos local...\n');
  const prisma = new PrismaClient();
  
  try {
    const ocs = await prisma.ordenCompra.findMany({ include: { cliente: true } });
    console.log(`✅ Órdenes de Compra en BD: ${ocs.length}`);
    ocs.forEach(oc => {
      console.log(`   - ${oc.codigoOc}: ${oc.estado} (Cliente: ${oc.cliente.nombreLegal})`);
    });

    const ovs = await prisma.ordenVenta.findMany({ include: { cliente: true, envio: true } });
    console.log(`\n✅ Órdenes de Venta en BD: ${ovs.length}`);
    ovs.forEach(ov => {
      console.log(`   - ${ov.codigoOv}: ${ov.estado} (Envío: ${ov.envio ? 'Sí' : 'No'})`);
    });

    const envios = await prisma.envio.findMany();
    console.log(`\n✅ Envíos en BD: ${envios.length}`);
    envios.forEach(envio => {
      console.log(`   - ${envio.numeroEnvio}: ${envio.estadoEnvio}`);
    });

  } catch (error) {
    console.error('❌ Error consultando BD:', error);
  } finally {
    await prisma.$disconnect();
  }
}

(async () => {
  await checkLocalDB();
  console.log('\n' + '='.repeat(60) + '\n');
  await testAPI();
})();
