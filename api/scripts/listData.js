const { PrismaClient } = require('@prisma/client');

(async () => {
  const prisma = new PrismaClient();
  try {
    const ocs = await prisma.ordenCompra.findMany();
    console.log('OC count:', ocs.length);
    const ovs = await prisma.ordenVenta.findMany({ include: { envio: true } });
    console.log('OVs:');
    ovs.forEach(o => console.log({ codigo: o.codigoOv, estado: o.estado, envio: !!o.envio }));
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();