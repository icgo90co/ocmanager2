import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { ApiError } from '../middleware/errorHandler';
import prisma from '../utils/prisma';

export const getAll = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const where: any = {};
    
    if (req.user?.role === 'cliente') {
      where.ordenVenta = { clienteId: req.user.clienteId };
    }

    const envios = await prisma.envio.findMany({
      where,
      include: {
        ordenVenta: {
          include: { cliente: { select: { nombreLegal: true } } },
        },
        eventos: {
          orderBy: { timestamp: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: envios });
  } catch (error) {
    next(error);
  }
};

export const getById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    const envio = await prisma.envio.findUnique({
      where: { id: parseInt(id) },
      include: {
        ordenVenta: {
          include: {
            cliente: true,
            items: { include: { producto: true } },
          },
        },
        eventos: { orderBy: { timestamp: 'asc' } },
      },
    });

    if (!envio) {
      throw new ApiError(404, 'Envío no encontrado');
    }

    if (req.user?.role === 'cliente' && envio.ordenVenta.clienteId !== req.user.clienteId) {
      throw new ApiError(403, 'No tiene permisos para ver este envío');
    }

    res.json({ success: true, data: envio });
  } catch (error) {
    next(error);
  }
};

export const createFromOV = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { ovId } = req.params;
    const { carrier, fechaSalida, fechaEntregaEstimada } = req.body;

    const ov = await prisma.ordenVenta.findUnique({
      where: { id: parseInt(ovId) },
      include: { envio: true },
    });

    if (!ov) {
      throw new ApiError(404, 'Orden de venta no encontrada');
    }

    if (ov.envio) {
      throw new ApiError(400, 'Esta orden ya tiene un envío asociado');
    }

    if (ov.estado !== 'enviada') {
      throw new ApiError(400, 'La orden debe estar en estado "enviada" para crear un envío');
    }

    const count = await prisma.envio.count();
    const numeroEnvio = `SH-${new Date().getFullYear()}-${String(count + 1).padStart(6, '0')}`;

    const envio = await prisma.envio.create({
      data: {
        ovId: ov.id,
        numeroEnvio,
        carrier,
        fechaSalida: fechaSalida ? new Date(fechaSalida) : null,
        fechaEntregaEstimada: fechaEntregaEstimada ? new Date(fechaEntregaEstimada) : null,
        estadoEnvio: 'preparando',
        eventos: {
          create: {
            timestamp: new Date(),
            ubicacion: 'Bodega',
            estadoEnvio: 'preparando',
            comentario: 'Envío creado',
          },
        },
      },
      include: {
        ordenVenta: true,
        eventos: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        entidad: 'Envio',
        entidadId: envio.id,
        accion: 'CREATE',
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });

    res.status(201).json({ success: true, data: envio });
  } catch (error) {
    next(error);
  }
};

export const addEvento = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { timestamp, ubicacion, estadoEnvio, comentario } = req.body;

    const envio = await prisma.envio.findUnique({
      where: { id: parseInt(id) },
    });

    if (!envio) {
      throw new ApiError(404, 'Envío no encontrado');
    }

    const evento = await prisma.envioEvento.create({
      data: {
        envioId: envio.id,
        timestamp: timestamp ? new Date(timestamp) : new Date(),
        ubicacion,
        estadoEnvio,
        comentario,
      },
    });

    // Actualizar estado del envío
    await prisma.envio.update({
      where: { id: envio.id },
      data: { estadoEnvio },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        entidad: 'EnvioEvento',
        entidadId: evento.id,
        accion: 'CREATE',
        diffJson: JSON.stringify({ envioId: envio.id, estadoEnvio }),
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });

    res.status(201).json({ success: true, data: evento });
  } catch (error) {
    next(error);
  }
};

export const getEventos = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const envio = await prisma.envio.findUnique({
      where: { id: parseInt(id) },
      include: { ordenVenta: { select: { clienteId: true } } },
    });

    if (!envio) {
      throw new ApiError(404, 'Envío no encontrado');
    }

    if (req.user?.role === 'cliente' && envio.ordenVenta.clienteId !== req.user.clienteId) {
      throw new ApiError(403, 'No tiene permisos para ver estos eventos');
    }

    const eventos = await prisma.envioEvento.findMany({
      where: { envioId: parseInt(id) },
      orderBy: { timestamp: 'asc' },
    });

    res.json({ success: true, data: eventos });
  } catch (error) {
    next(error);
  }
};
