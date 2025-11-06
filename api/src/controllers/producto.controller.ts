import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { ApiError } from '../middleware/errorHandler';
import prisma from '../utils/prisma';

export const getAll = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { search, sku, activo } = req.query;
    
    const where: any = {};
    
    if (search) {
      where.OR = [
        { nombre: { contains: search as string } },
        { descripcion: { contains: search as string } },
        { sku: { contains: search as string } },
      ];
    }
    
    if (sku) {
      where.sku = { contains: sku as string };
    }
    
    if (activo !== undefined) {
      where.activo = activo === 'true';
    }

    const productos = await prisma.producto.findMany({
      where,
      orderBy: { nombre: 'asc' },
    });

    res.json({ success: true, data: productos });
  } catch (error) {
    next(error);
  }
};

export const getById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const producto = await prisma.producto.findUnique({
      where: { id: parseInt(id) },
    });

    if (!producto) {
      throw new ApiError(404, 'Producto no encontrado');
    }

    res.json({ success: true, data: producto });
  } catch (error) {
    next(error);
  }
};

export const create = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { sku, nombre, descripcion, unidad, precioBase, activo } = req.body;

    const existing = await prisma.producto.findUnique({ where: { sku } });
    if (existing) {
      throw new ApiError(400, 'Ya existe un producto con ese SKU');
    }

    const producto = await prisma.producto.create({
      data: { sku, nombre, descripcion, unidad, precioBase, activo },
    });

    res.status(201).json({ success: true, data: producto });
  } catch (error) {
    next(error);
  }
};

export const update = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const producto = await prisma.producto.update({
      where: { id: parseInt(id) },
      data,
    });

    res.json({ success: true, data: producto });
  } catch (error) {
    next(error);
  }
};

export const remove = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    await prisma.producto.delete({
      where: { id: parseInt(id) },
    });

    res.json({ success: true, message: 'Producto eliminado' });
  } catch (error) {
    next(error);
  }
};
