import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { ApiError } from '../middleware/errorHandler';
import prisma from '../utils/prisma';
import { Decimal } from '@prisma/client/runtime/library';

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
    const { notas } = req.body;

    const orden = await prisma.ordenVenta.findUnique({
      where: { id: parseInt(id) },
    });

    if (!orden) {
      throw new ApiError(404, 'Orden no encontrada');
    }

    if (['procesada'].includes(orden.estado)) {
      throw new ApiError(400, 'No se puede editar una orden en estado ' + orden.estado);
    }

    const updated = await prisma.ordenVenta.update({
      where: { id: parseInt(id) },
      data: { notas },
      include: { items: true, cliente: true },
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
