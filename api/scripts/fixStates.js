const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixOldStates() {
  console.log('🔧 Corrigiendo estados antiguos en la base de datos...\n');
  
  try {
    // Conectar directamente a la DB y actualizar estados no válidos
    console.log('1. Actualizando estados en ordenes_compra...');
    const ocUpdates = await prisma.$executeRawUnsafe(`
      UPDATE ordenes_compra 
      SET estado = CASE 
        WHEN estado = 'en_proceso' THEN 'procesando'
        WHEN estado = 'enviada' THEN 'procesada'
        WHEN estado = 'finalizada' THEN 'procesada'
        WHEN estado = 'cancelada' THEN 'anulada'
        ELSE estado
      END
      WHERE estado IN ('en_proceso', 'enviada', 'finalizada', 'cancelada')
    `);
    console.log(`   ✅ ${ocUpdates} órdenes de compra actualizadas`);

    console.log('\n2. Actualizando estados en ordenes_venta...');
    const ovUpdates = await prisma.$executeRawUnsafe(`
      UPDATE ordenes_venta 
      SET estado = CASE 
        WHEN estado = 'en_proceso' THEN 'procesando'
        WHEN estado = 'enviada' THEN 'en_despacho'
        WHEN estado = 'finalizada' THEN 'procesada'
        WHEN estado = 'cancelada' THEN 'anulada'
        ELSE estado
      END
      WHERE estado IN ('en_proceso', 'enviada', 'finalizada', 'cancelada')
    `);
    console.log(`   ✅ ${ovUpdates} órdenes de venta actualizadas`);

    console.log('\n3. Verificando órdenes actualizadas...');
    const ocs = await prisma.ordenCompra.findMany({ 
      select: { codigoOc: true, estado: true } 
    });
    console.log('   Órdenes de Compra:');
    ocs.forEach(oc => console.log(`      - ${oc.codigoOc}: ${oc.estado}`));

    const ovs = await prisma.ordenVenta.findMany({ 
      select: { codigoOv: true, estado: true } 
    });
    console.log('   Órdenes de Venta:');
    ovs.forEach(ov => console.log(`      - ${ov.codigoOv}: ${ov.estado}`));

    console.log('\n✅ ¡Corrección completada!\n');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

fixOldStates();
