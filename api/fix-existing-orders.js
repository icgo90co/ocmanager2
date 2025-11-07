const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixExistingOrders() {
  try {
    console.log('🔧 Actualizando órdenes existentes con estados antiguos...\n');
    
    // Obtener todas las OC con estados antiguos usando query raw
    const oldOCs = await prisma.$queryRaw`
      SELECT id, codigo_oc, estado FROM ordenes_compra 
      WHERE estado NOT IN ('recibida', 'procesando', 'pendiente_ajustes', 'procesada', 'anulada', 'en_despacho')
    `;
    
    console.log(`📦 Órdenes de Compra con estados antiguos: ${oldOCs.length}`);
    
    for (const oc of oldOCs) {
      console.log(`  - ${oc.codigo_oc}: ${oc.estado}`);
    }
    
    // Obtener todas las OV con estados antiguos
    const oldOVs = await prisma.$queryRaw`
      SELECT id, codigo_ov, estado FROM ordenes_venta 
      WHERE estado NOT IN ('recibida', 'procesando', 'pendiente_ajustes', 'procesada', 'anulada', 'en_despacho')
    `;
    
    console.log(`\n📋 Órdenes de Venta con estados antiguos: ${oldOVs.length}`);
    
    for (const ov of oldOVs) {
      console.log(`  - ${ov.codigo_ov}: ${ov.estado}`);
    }
    
    // Ejecutar las actualizaciones que ya creamos en la migración
    console.log('\n🔄 Ejecutando actualizaciones...\n');
    
    const updateOC1 = await prisma.$executeRaw`
      UPDATE ordenes_compra SET estado = 'procesando' WHERE estado = 'en_proceso'
    `;
    console.log(`✅ OCs en_proceso → procesando: ${updateOC1} actualizadas`);
    
    const updateOC2 = await prisma.$executeRaw`
      UPDATE ordenes_compra SET estado = 'procesada' WHERE estado = 'finalizada'
    `;
    console.log(`✅ OCs finalizada → procesada: ${updateOC2} actualizadas`);
    
    const updateOC3 = await prisma.$executeRaw`
      UPDATE ordenes_compra SET estado = 'anulada' WHERE estado = 'cancelada'
    `;
    console.log(`✅ OCs cancelada → anulada: ${updateOC3} actualizadas`);
    
    const updateOC4 = await prisma.$executeRaw`
      UPDATE ordenes_compra SET estado = 'en_despacho' WHERE estado = 'enviada'
    `;
    console.log(`✅ OCs enviada → en_despacho: ${updateOC4} actualizadas`);
    
    const updateOV1 = await prisma.$executeRaw`
      UPDATE ordenes_venta SET estado = 'procesando' WHERE estado = 'en_proceso'
    `;
    console.log(`✅ OVs en_proceso → procesando: ${updateOV1} actualizadas`);
    
    const updateOV2 = await prisma.$executeRaw`
      UPDATE ordenes_venta SET estado = 'procesada' WHERE estado = 'finalizada'
    `;
    console.log(`✅ OVs finalizada → procesada: ${updateOV2} actualizadas`);
    
    const updateOV3 = await prisma.$executeRaw`
      UPDATE ordenes_venta SET estado = 'anulada' WHERE estado = 'cancelada'
    `;
    console.log(`✅ OVs cancelada → anulada: ${updateOV3} actualizadas`);
    
    const updateOV4 = await prisma.$executeRaw`
      UPDATE ordenes_venta SET estado = 'en_despacho' WHERE estado = 'enviada'
    `;
    console.log(`✅ OVs enviada → en_despacho: ${updateOV4} actualizadas`);
    
    // Verificar que todas las órdenes ahora tienen estados válidos
    console.log('\n🔍 Verificando estados actualizados...\n');
    
    const allOCs = await prisma.ordenCompra.findMany({
      select: { id: true, codigoOc: true, estado: true }
    });
    console.log(`📦 Total Órdenes de Compra: ${allOCs.length}`);
    allOCs.forEach(oc => {
      console.log(`  - ${oc.codigoOc}: ${oc.estado}`);
    });
    
    const allOVs = await prisma.ordenVenta.findMany({
      select: { id: true, codigoOv: true, estado: true }
    });
    console.log(`\n📋 Total Órdenes de Venta: ${allOVs.length}`);
    allOVs.forEach(ov => {
      console.log(`  - ${ov.codigoOv}: ${ov.estado}`);
    });
    
    console.log('\n✅ Proceso completado exitosamente!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

fixExistingOrders();
