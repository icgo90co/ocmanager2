import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../utils/prisma';

export const getAll = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { entidad, entidadId, userId, limit = '50' } = req.query;

    const where: any = {};

    if (entidad) {
      where.entidad = entidad;
    }

    if (entidadId) {
      where.entidadId = parseInt(entidadId as string);
    }

    if (userId) {
      where.userId = parseInt(userId as string);
    }

    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: { nombre: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
    });

    res.json({ success: true, data: logs });
  } catch (error) {
    next(error);
  }
};
