import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { ApiError } from '../middleware/errorHandler';
import prisma from '../utils/prisma';
import { Decimal } from '@prisma/client/runtime/library';
import PDFDocument from 'pdfkit';

const VALID_TRANSITIONS: Record<string, string[]> = {
  recibida: ['procesando'],
  procesando: ['en_despacho'],
  en_despacho: ['procesada'],
  procesada: [],
};

export const getAll = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { estado, clienteId, codigoOv } = req.query;
    
    const where: any = {};
    
    if (req.user?.role === 'cliente') {
      where.clienteId = req.user.clienteId;
    } else if (clienteId) {
      where.clienteId = parseInt(clienteId as string);
    }
    
    if (estado) {
      where.estado = estado;
    }
    
    if (codigoOv) {
      where.codigoOv = { contains: codigoOv as string };
    }

    const ordenes = await prisma.ordenVenta.findMany({
      where,
      include: {
        cliente: { select: { nombreLegal: true } },
        items: { include: { producto: true } },
        envio: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: ordenes });
  } catch (error) {
    next(error);
  }
};

export const getById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    const orden = await prisma.ordenVenta.findUnique({
      where: { id: parseInt(id) },
      include: {
        cliente: true,
        items: { include: { producto: true } },
        ordenCompra: true,
        envio: { include: { eventos: { orderBy: { timestamp: 'asc' } } } },
      },
    });

    if (!orden) {
      throw new ApiError(404, 'Orden de venta no encontrada');
    }

    if (req.user?.role === 'cliente' && orden.clienteId !== req.user.clienteId) {
      throw new ApiError(403, 'No tiene permisos para ver esta orden');
    }

    res.json({ success: true, data: orden });
  } catch (error) {
    next(error);
  }
};

export const create = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { clienteId, items, notas, moneda = 'COP' } = req.body;

    const count = await prisma.ordenVenta.count();
    const codigoOv = `OV-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

    let total = new Decimal(0);
    const itemsData = items.map((item: any) => {
      const subtotal = new Decimal(item.cantidad).mul(new Decimal(item.precioUnitario));
      total = total.add(subtotal);
      return { ...item, subtotal: subtotal.toNumber() };
    });

    const orden = await prisma.ordenVenta.create({
      data: {
        codigoOv,
        clienteId,
        total: total.toNumber(),
        moneda,
        notas,
        items: { create: itemsData },
      },
      include: { items: true, cliente: true },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        entidad: 'OrdenVenta',
        entidadId: orden.id,
        accion: 'CREATE',
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });

    res.status(201).json({ success: true, data: orden });
  } catch (error) {
    next(error);
  }
};

export const createFromOC = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { ocId } = req.params;
    
    const oc = await prisma.ordenCompra.findUnique({
      where: { id: parseInt(ocId) },
      include: { items: true },
    });

    if (!oc) {
      throw new ApiError(404, 'Orden de compra no encontrada');
    }

    const count = await prisma.ordenVenta.count();
    const codigoOv = `OV-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

    const itemsData = oc.items.map((item) => ({
      productoId: item.productoId,
      sku: item.sku,
      descripcion: item.descripcion,
      cantidad: item.cantidad,
      precioUnitario: item.precioUnitario,
      subtotal: item.subtotal,
    }));

    const orden = await prisma.ordenVenta.create({
      data: {
        codigoOv,
        ocId: oc.id,
        clienteId: oc.clienteId,
        total: oc.total,
        moneda: oc.moneda,
        notas: `Generada desde OC ${oc.codigoOc}`,
        items: { create: itemsData },
      },
      include: { items: true, cliente: true, ordenCompra: true },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        entidad: 'OrdenVenta',
        entidadId: orden.id,
        accion: 'CREATE_FROM_OC',
        diffJson: JSON.stringify({ ocId: oc.id }),
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });

    res.status(201).json({ success: true, data: orden });
  } catch (error) {
    next(error);
  }
};

export const update = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { clienteId, notas, items } = req.body;

    const orden = await prisma.ordenVenta.findUnique({
      where: { id: parseInt(id) },
      include: { items: true },
    });

    if (!orden) {
      throw new ApiError(404, 'Orden no encontrada');
    }

    if (['procesada', 'anulada'].includes(orden.estado)) {
      throw new ApiError(400, 'No se puede editar una orden en estado ' + orden.estado);
    }

    // Preparar datos de actualización
    const updateData: any = {};
    if (notas !== undefined) updateData.notas = notas;
    if (clienteId !== undefined) updateData.clienteId = clienteId;

    // Si se proporcionan items, actualizar la orden completa
    if (items && Array.isArray(items)) {
      // Validar items
      for (const item of items) {
        if (!item.sku || !item.descripcion || item.precioUnitario === undefined || item.cantidad === undefined) {
          throw new ApiError(400, 'Todos los ítems deben tener SKU, descripción, precio unitario y cantidad');
        }
      }

      // Calcular nuevo total
      const nuevoTotal = items.reduce((sum: number, item: any) => {
        const subtotal = Number(item.cantidad) * Number(item.precioUnitario);
        return sum + subtotal;
      }, 0);

      updateData.total = nuevoTotal;

      // Eliminar items antiguos y crear nuevos en una transacción
      const itemsData = items.map((item: any) => ({
        sku: item.sku,
        descripcion: item.descripcion,
        cantidad: item.cantidad,
        precioUnitario: item.precioUnitario,
        subtotal: Number(item.cantidad) * Number(item.precioUnitario),
        productoId: item.productoId || null,
      }));

      await prisma.oVItem.deleteMany({
        where: { ovId: parseInt(id) },
      });

      updateData.items = { create: itemsData };
    }

    const updated = await prisma.ordenVenta.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: { items: true, cliente: true, ordenCompra: true },
    });

    // Registrar en audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        entidad: 'OrdenVenta',
        entidadId: orden.id,
        accion: 'UPDATE',
        diffJson: JSON.stringify({
          before: {
            clienteId: orden.clienteId,
            notas: orden.notas,
            total: orden.total,
            itemsCount: orden.items.length,
          },
          after: {
            clienteId: updateData.clienteId || orden.clienteId,
            notas: updateData.notas !== undefined ? updateData.notas : orden.notas,
            total: updateData.total || orden.total,
            itemsCount: items?.length || orden.items.length,
          },
        }),
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

export const changeEstado = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    const orden = await prisma.ordenVenta.findUnique({
      where: { id: parseInt(id) },
    });

    if (!orden) {
      throw new ApiError(404, 'Orden no encontrada');
    }

    if (!VALID_TRANSITIONS[orden.estado]?.includes(estado)) {
      throw new ApiError(400, `No se puede cambiar de ${orden.estado} a ${estado}`);
    }

    const updated = await prisma.ordenVenta.update({
      where: { id: parseInt(id) },
      data: { estado },
      include: { items: true, cliente: true },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        entidad: 'OrdenVenta',
        entidadId: orden.id,
        accion: 'CHANGE_ESTADO',
        diffJson: JSON.stringify({ from: orden.estado, to: estado }),
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

export const generatePDF = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const ov = await prisma.ordenVenta.findUnique({
      where: { id: parseInt(id) },
      include: {
        cliente: true,
        items: {
          include: { producto: true }
        },
        ordenCompra: true,
        envio: true,
      },
    });

    if (!ov) {
      throw new ApiError(404, 'Orden de venta no encontrada');
    }

    // Verificar permisos
    if (req.user?.role === 'cliente' && ov.clienteId !== req.user.clienteId) {
      throw new ApiError(403, 'No tiene permisos para ver esta orden');
    }

    // Crear documento PDF
    const doc = new PDFDocument({ margin: 50, size: 'LETTER' });

    // Configurar headers para descarga
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=OV-${ov.codigoOv}.pdf`);

    // Pipe el PDF al response
    doc.pipe(res);

    // === HEADER ===
    doc.fontSize(20).font('Helvetica-Bold').text('ORDEN DE VENTA', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(14).font('Helvetica').text(ov.codigoOv, { align: 'center' });
    doc.moveDown(1);

    // === INFORMACIÓN GENERAL ===
    const startY = doc.y;
    doc.fontSize(10).font('Helvetica-Bold');
    
    // Columna izquierda
    doc.text('CLIENTE:', 50, startY);
    doc.font('Helvetica').text(ov.cliente.nombreLegal, 50, startY + 15);
    doc.text(`NIT: ${ov.cliente.nit}`, 50, startY + 30);
    doc.text(`Email: ${ov.cliente.email}`, 50, startY + 45);
    if (ov.cliente.telefono) {
      doc.text(`Teléfono: ${ov.cliente.telefono}`, 50, startY + 60);
    }
    if (ov.cliente.direccion) {
      doc.text(`Dirección: ${ov.cliente.direccion}`, 50, startY + 75);
    }

    // Columna derecha
    doc.font('Helvetica-Bold').text('INFORMACIÓN DE LA ORDEN:', 320, startY);
    doc.font('Helvetica').text(`Fecha: ${new Date(ov.createdAt).toLocaleDateString('es-CO')}`, 320, startY + 15);
    doc.text(`Estado: ${ov.estado.toUpperCase()}`, 320, startY + 30);
    doc.text(`Moneda: ${ov.moneda}`, 320, startY + 45);
    if (ov.ordenCompra) {
      doc.text(`OC Asociada: ${ov.ordenCompra.codigoOc}`, 320, startY + 60);
    }

    doc.moveDown(6);

    // === TABLA DE ITEMS ===
    const tableTop = doc.y + 20;
    doc.fontSize(11).font('Helvetica-Bold');
    doc.text('DETALLE DE PRODUCTOS', 50, tableTop);
    
    const itemsTableTop = tableTop + 25;
    
    // Headers de la tabla
    doc.fontSize(9).font('Helvetica-Bold');
    doc.text('SKU', 50, itemsTableTop);
    doc.text('DESCRIPCIÓN', 130, itemsTableTop);
    doc.text('CANT.', 350, itemsTableTop, { width: 50, align: 'right' });
    doc.text('PRECIO UNIT.', 410, itemsTableTop, { width: 70, align: 'right' });
    doc.text('SUBTOTAL', 490, itemsTableTop, { width: 70, align: 'right' });

    // Línea debajo de headers
    doc.moveTo(50, itemsTableTop + 15).lineTo(560, itemsTableTop + 15).stroke();

    // Items
    let yPosition = itemsTableTop + 25;
    doc.font('Helvetica').fontSize(8);

    ov.items.forEach((item: any) => {
      if (yPosition > 700) {
        doc.addPage();
        yPosition = 50;
      }

      const descripcion = item.descripcion.length > 40 
        ? item.descripcion.substring(0, 37) + '...'
        : item.descripcion;

      doc.text(item.sku, 50, yPosition, { width: 70 });
      doc.text(descripcion, 130, yPosition, { width: 210 });
      doc.text(item.cantidad.toString(), 350, yPosition, { width: 50, align: 'right' });
      doc.text(
        new Intl.NumberFormat('es-CO', { style: 'currency', currency: ov.moneda }).format(Number(item.precioUnitario)),
        410,
        yPosition,
        { width: 70, align: 'right' }
      );
      doc.text(
        new Intl.NumberFormat('es-CO', { style: 'currency', currency: ov.moneda }).format(Number(item.subtotal)),
        490,
        yPosition,
        { width: 70, align: 'right' }
      );

      yPosition += 20;
    });

    // Línea antes del total
    yPosition += 10;
    doc.moveTo(400, yPosition).lineTo(560, yPosition).stroke();

    // Total
    yPosition += 15;
    doc.fontSize(11).font('Helvetica-Bold');
    doc.text('TOTAL:', 400, yPosition);
    doc.text(
      new Intl.NumberFormat('es-CO', { style: 'currency', currency: ov.moneda }).format(Number(ov.total)),
      490,
      yPosition,
      { width: 70, align: 'right' }
    );

    // === NOTAS ===
    if (ov.notas) {
      yPosition += 40;
      if (yPosition > 650) {
        doc.addPage();
        yPosition = 50;
      }
      doc.fontSize(10).font('Helvetica-Bold').text('NOTAS:', 50, yPosition);
      doc.fontSize(9).font('Helvetica').text(ov.notas, 50, yPosition + 15, { width: 500 });
    }

    // === INFORMACIÓN DE ENVÍO ===
    if (ov.envio) {
      yPosition += 60;
      if (yPosition > 650) {
        doc.addPage();
        yPosition = 50;
      }
      doc.fontSize(10).font('Helvetica-Bold').text('INFORMACIÓN DE ENVÍO', 50, yPosition);
      doc.fontSize(9).font('Helvetica');
      doc.text(`Número de Envío: ${ov.envio.numeroEnvio}`, 50, yPosition + 15);
      doc.text(`Estado: ${ov.envio.estadoEnvio}`, 50, yPosition + 30);
      if (ov.envio.carrier) {
        doc.text(`Carrier: ${ov.envio.carrier}`, 50, yPosition + 45);
      }
      if (ov.envio.fechaSalida) {
        doc.text(`Fecha de Salida: ${new Date(ov.envio.fechaSalida).toLocaleDateString('es-CO')}`, 50, yPosition + 60);
      }
      if (ov.envio.fechaEntregaEstimada) {
        doc.text(
          `Fecha Estimada de Entrega: ${new Date(ov.envio.fechaEntregaEstimada).toLocaleDateString('es-CO')}`,
          50,
          yPosition + 75
        );
      }
    }

    // === FOOTER ===
    const pageHeight = doc.page.height;
    doc.fontSize(8).font('Helvetica').text(
      `Documento generado el ${new Date().toLocaleString('es-CO')}`,
      50,
      pageHeight - 50,
      { align: 'center', width: 500 }
    );

    // Finalizar el PDF
    doc.end();

    // Registrar en audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        entidad: 'OrdenVenta',
        entidadId: ov.id,
        accion: 'DOWNLOAD_PDF',
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });

  } catch (error) {
    next(error);
  }
};
