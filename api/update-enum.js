const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateEnumInDatabase() {
  try {
    console.log('🔧 Actualizando ENUM de estado en la base de datos...\n');
    
    // Primero verificar el enum actual
    console.log('📋 Verificando estructura actual...\n');
    
    const result = await prisma.$queryRaw`
      SHOW COLUMNS FROM ordenes_compra WHERE Field = 'estado'
    `;
    
    console.log('Estado actual de columna ordenes_compra.estado:', result);
    
    // Ahora vamos a modificar el enum correctamente
    console.log('\n🔄 Modificando enums en las tablas...\n');
    
    // Para ordenes_compra
    await prisma.$executeRaw`
      ALTER TABLE ordenes_compra 
      MODIFY COLUMN estado ENUM('recibida', 'procesando', 'pendiente_ajustes', 'procesada', 'anulada', 'en_despacho') 
      NOT NULL DEFAULT 'recibida'
    `;
    console.log('✅ Enum actualizado en ordenes_compra');
    
    // Para ordenes_venta
    await prisma.$executeRaw`
      ALTER TABLE ordenes_venta 
      MODIFY COLUMN estado ENUM('recibida', 'procesando', 'pendiente_ajustes', 'procesada', 'anulada', 'en_despacho') 
      NOT NULL DEFAULT 'recibida'
    `;
    console.log('✅ Enum actualizado en ordenes_venta');
    
    // Verificar nuevamente
    console.log('\n📋 Verificando estructura actualizada...\n');
    
    const result2 = await prisma.$queryRaw`
      SHOW COLUMNS FROM ordenes_compra WHERE Field = 'estado'
    `;
    
    console.log('Nueva estructura de ordenes_compra.estado:', result2);
    
    console.log('\n✅ Enums actualizados correctamente!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

updateEnumInDatabase();
