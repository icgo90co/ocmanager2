import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import bcrypt from 'bcrypt';
import prisma from '../utils/prisma';

export const runSeed = async (req: Request, res: Response) => {
  try {
    logger.info('🌱 Starting database seed...');

    // Crear clientes
    const clienteAcme = await prisma.cliente.upsert({
      where: { nit: '900123456-7' },
      update: {},
      create: {
        nombreLegal: 'Acme Inc.',
        nit: '900123456-7',
        email: 'contacto@acme.com',
        telefono: '+57 310 1234567',
        direccion: 'Calle 100 #15-20',
        ciudad: 'Bogotá',
        pais: 'Colombia',
      },
    });

    const clienteTech = await prisma.cliente.upsert({
      where: { nit: '900789012-3' },
      update: {},
      create: {
        nombreLegal: 'Tech Solutions S.A.S.',
        nit: '900789012-3',
        email: 'info@techsolutions.com',
        telefono: '+57 315 9876543',
        direccion: 'Carrera 7 #80-45',
        ciudad: 'Bogotá',
        pais: 'Colombia',
      },
    });

    logger.info(`✅ Clientes creados: ${clienteAcme.nombreLegal}, ${clienteTech.nombreLegal}`);

    // Crear usuarios
    const adminPassword = await bcrypt.hash('admin123', 10);
    const clientePassword = await bcrypt.hash('cliente123', 10);

    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@ocmanager.com' },
      update: {},
      create: {
        nombre: 'Admin Usuario',
        email: 'admin@ocmanager.com',
        hashPassword: adminPassword,
        role: 'admin',
        activo: true,
      },
    });

    const clienteUser = await prisma.user.upsert({
      where: { email: 'cliente@acme.com' },
      update: {},
      create: {
        nombre: 'Juan Pérez',
        email: 'cliente@acme.com',
        hashPassword: clientePassword,
        role: 'cliente',
        clienteId: clienteAcme.id,
        activo: true,
      },
    });

    logger.info(`✅ Usuarios creados: ${adminUser.email}, ${clienteUser.email}`);

    // Crear productos
    const productos = await Promise.all([
      prisma.producto.upsert({
        where: { sku: 'PROD-001' },
        update: {},
        create: {
          sku: 'PROD-001',
          nombre: 'Laptop Dell Inspiron 15',
          descripcion: 'Laptop Dell Inspiron 15, 8GB RAM, 512GB SSD',
          unidad: 'UND',
          precioBase: 2500000,
          activo: true,
        },
      }),
      prisma.producto.upsert({
        where: { sku: 'PROD-002' },
        update: {},
        create: {
          sku: 'PROD-002',
          nombre: 'Mouse Logitech MX Master 3',
          descripcion: 'Mouse inalámbrico ergonómico',
          unidad: 'UND',
          precioBase: 350000,
          activo: true,
        },
      }),
      prisma.producto.upsert({
        where: { sku: 'PROD-003' },
        update: {},
        create: {
          sku: 'PROD-003',
          nombre: 'Teclado Mecánico Keychron K2',
          descripcion: 'Teclado mecánico inalámbrico 75%',
          unidad: 'UND',
          precioBase: 450000,
          activo: true,
        },
      }),
      prisma.producto.upsert({
        where: { sku: 'PROD-004' },
        update: {},
        create: {
          sku: 'PROD-004',
          nombre: 'Monitor LG 27" 4K',
          descripcion: 'Monitor LG UltraFine 4K 27 pulgadas',
          unidad: 'UND',
          precioBase: 1800000,
          activo: true,
        },
      }),
      prisma.producto.upsert({
        where: { sku: 'PROD-005' },
        update: {},
        create: {
          sku: 'PROD-005',
          nombre: 'Cable USB-C 2m',
          descripcion: 'Cable USB-C a USB-C, 100W, 2 metros',
          unidad: 'UND',
          precioBase: 45000,
          activo: true,
        },
      }),
    ]);

    logger.info(`✅ ${productos.length} productos creados`);

    // Crear órdenes de compra de ejemplo
    const oc1 = await prisma.ordenCompra.upsert({
      where: { codigoOc: 'OC-2024-00001' },
      update: {},
      create: {
        codigoOc: 'OC-2024-00001',
        clienteId: clienteAcme.id,
        total: 5600000,
        moneda: 'COP',
        estado: 'recibida',
        notas: 'Orden urgente para proyecto piloto',
        origen: 'manual',
        items: {
          create: [
            {
              productoId: productos[0].id,
              sku: productos[0].sku,
              descripcion: productos[0].nombre,
              cantidad: 2,
              precioUnitario: 2500000,
              subtotal: 5000000,
            },
            {
              productoId: productos[1].id,
              sku: productos[1].sku,
              descripcion: productos[1].nombre,
              cantidad: 2,
              precioUnitario: 350000,
              subtotal: 700000,
            },
          ],
        },
      },
    });

    const oc2 = await prisma.ordenCompra.upsert({
      where: { codigoOc: 'OC-2024-00002' },
      update: {},
      create: {
        codigoOc: 'OC-2024-00002',
        clienteId: clienteTech.id,
        total: 2250000,
        moneda: 'COP',
        estado: 'en_proceso',
        notas: 'Material de oficina',
        origen: 'manual',
        items: {
          create: [
            {
              productoId: productos[3].id,
              sku: productos[3].sku,
              descripcion: productos[3].nombre,
              cantidad: 1,
              precioUnitario: 1800000,
              subtotal: 1800000,
            },
            {
              productoId: productos[2].id,
              sku: productos[2].sku,
              descripcion: productos[2].nombre,
              cantidad: 1,
              precioUnitario: 450000,
              subtotal: 450000,
            },
          ],
        },
      },
    });

    logger.info(`✅ Órdenes de compra creadas: ${oc1.codigoOc}, ${oc2.codigoOc}`);

    // Crear orden de venta y envío
    const existingOv = await prisma.ordenVenta.findUnique({
      where: { codigoOv: 'OV-2024-00001' },
    });

    if (!existingOv) {
      const ov1 = await prisma.ordenVenta.create({
        data: {
          codigoOv: 'OV-2024-00001',
          ocId: oc1.id,
          clienteId: clienteAcme.id,
          total: 5600000,
          moneda: 'COP',
          estado: 'enviada',
          notas: 'Generada desde OC-2024-00001',
          items: {
            create: [
              {
                productoId: productos[0].id,
                sku: productos[0].sku,
                descripcion: productos[0].nombre,
                cantidad: 2,
                precioUnitario: 2500000,
                subtotal: 5000000,
              },
              {
                productoId: productos[1].id,
                sku: productos[1].sku,
                descripcion: productos[1].nombre,
                cantidad: 2,
                precioUnitario: 350000,
                subtotal: 700000,
              },
            ],
          },
        },
      });

      const envio1 = await prisma.envio.create({
        data: {
          ovId: ov1.id,
          numeroEnvio: 'SH-2024-000001',
          carrier: 'Coordinadora',
          estadoEnvio: 'en_transito',
          fechaSalida: new Date('2024-11-01'),
          fechaEntregaEstimada: new Date('2024-11-06'),
          eventos: {
            create: [
              {
                timestamp: new Date('2024-11-01T08:00:00'),
                ubicacion: 'Bodega Principal - Bogotá',
                estadoEnvio: 'preparando',
                comentario: 'Paquete preparado para despacho',
              },
              {
                timestamp: new Date('2024-11-01T14:00:00'),
                ubicacion: 'Centro de distribución - Bogotá',
                estadoEnvio: 'en_transito',
                comentario: 'En ruta hacia destino',
              },
              {
                timestamp: new Date('2024-11-03T10:30:00'),
                ubicacion: 'Centro de distribución - Cali',
                estadoEnvio: 'en_transito',
                comentario: 'Paquete en tránsito',
              },
            ],
          },
        },
      });

      logger.info(`✅ Orden de venta y envío creados: ${ov1.codigoOv}, ${envio1.numeroEnvio}`);
    } else {
      logger.info(`✅ Orden de venta ya existe: OV-2024-00001`);
    }

    logger.info('🎉 Seed completado exitosamente!');

    res.json({
      success: true,
      message: 'Base de datos poblada exitosamente',
      data: {
        clientes: 2,
        usuarios: 2,
        productos: productos.length,
        ordenesCompra: 2,
        ordenesVenta: 1,
        envios: 1,
      },
    });
  } catch (error: any) {
    logger.error(`Seed error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error al ejecutar seed',
      error: error.message,
      stack: error.stack,
    });
  }
};
