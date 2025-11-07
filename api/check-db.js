const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('🔍 Verificando conexión y datos en la base de datos...\n');
    
    // Verificar conexión
    await prisma.$connect();
    console.log('✅ Conexión exitosa a la base de datos\n');
    
    // Contar registros en cada tabla
    const userCount = await prisma.user.count();
    console.log(`👤 Usuarios: ${userCount}`);
    
    const clienteCount = await prisma.cliente.count();
    console.log(`🏢 Clientes: ${clienteCount}`);
    
    const productoCount = await prisma.producto.count();
    console.log(`📦 Productos: ${productoCount}`);
    
    const ocCount = await prisma.ordenCompra.count();
    console.log(`📋 Órdenes de Compra: ${ocCount}`);
    
    const ovCount = await prisma.ordenVenta.count();
    console.log(`📄 Órdenes de Venta: ${ovCount}`);
    
    const envioCount = await prisma.envio.count();
    console.log(`🚚 Envíos: ${envioCount}`);
    
    // Si hay usuarios, mostrarlos
    if (userCount > 0) {
      console.log('\n📋 Usuarios en la base de datos:');
      const users = await prisma.user.findMany({
        select: { id: true, nombre: true, email: true, role: true }
      });
      users.forEach(u => {
        console.log(`  - ${u.nombre} (${u.email}) - ${u.role}`);
      });
    }
    
    // Si hay clientes, mostrarlos
    if (clienteCount > 0) {
      console.log('\n🏢 Clientes en la base de datos:');
      const clientes = await prisma.cliente.findMany({
        select: { id: true, nombreLegal: true, nit: true }
      });
      clientes.forEach(c => {
        console.log(`  - ${c.nombreLegal} (${c.nit})`);
      });
    }
    
    // Si hay OCs, mostrarlas
    if (ocCount > 0) {
      console.log('\n📋 Órdenes de Compra:');
      const ocs = await prisma.ordenCompra.findMany({
        select: { id: true, codigoOc: true, estado: true, total: true }
      });
      ocs.forEach(oc => {
        console.log(`  - ${oc.codigoOc}: ${oc.estado} - $${oc.total}`);
      });
    }
    
    // Si hay OVs, mostrarlas
    if (ovCount > 0) {
      console.log('\n📄 Órdenes de Venta:');
      const ovs = await prisma.ordenVenta.findMany({
        select: { id: true, codigoOv: true, estado: true, total: true }
      });
      ovs.forEach(ov => {
        console.log(`  - ${ov.codigoOv}: ${ov.estado} - $${ov.total}`);
      });
    }
    
    console.log('\n✅ Verificación completada');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
