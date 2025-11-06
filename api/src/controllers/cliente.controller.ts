import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { ApiError } from '../middleware/errorHandler';
import prisma from '../utils/prisma';

export const getAll = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const clientes = await prisma.cliente.findMany({
      orderBy: { nombreLegal: 'asc' },
    });

    res.json({ success: true, data: clientes });
  } catch (error) {
    next(error);
  }
};

export const getById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const cliente = await prisma.cliente.findUnique({
      where: { id: parseInt(id) },
      include: {
        users: {
          select: { id: true, nombre: true, email: true, activo: true },
        },
      },
    });

    if (!cliente) {
      throw new ApiError(404, 'Cliente no encontrado');
    }

    res.json({ success: true, data: cliente });
  } catch (error) {
    next(error);
  }
};

export const create = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { nombreLegal, nit, email, telefono, direccion, ciudad, pais } = req.body;

    const existing = await prisma.cliente.findUnique({ where: { nit } });
    if (existing) {
      throw new ApiError(400, 'Ya existe un cliente con ese NIT');
    }

    const cliente = await prisma.cliente.create({
      data: { nombreLegal, nit, email, telefono, direccion, ciudad, pais },
    });

    res.status(201).json({ success: true, data: cliente });
  } catch (error) {
    next(error);
  }
};

export const update = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const cliente = await prisma.cliente.update({
      where: { id: parseInt(id) },
      data,
    });

    res.json({ success: true, data: cliente });
  } catch (error) {
    next(error);
  }
};

export const remove = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    await prisma.cliente.delete({
      where: { id: parseInt(id) },
    });

    res.json({ success: true, message: 'Cliente eliminado' });
  } catch (error) {
    next(error);
  }
};
