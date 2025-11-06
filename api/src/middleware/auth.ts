import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ApiError } from './errorHandler';
import prisma from '../utils/prisma';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
    clienteId?: number;
  };
  file?: Express.Multer.File;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

    if (!token) {
      throw new ApiError(401, 'No autorizado - Token no proporcionado');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: number;
      email: string;
      role: string;
      clienteId?: number;
    };

    // Verificar que el usuario siga activo
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, role: true, clienteId: true, activo: true },
    });

    if (!user || !user.activo) {
      throw new ApiError(401, 'Usuario no autorizado o inactivo');
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      clienteId: user.clienteId || undefined,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new ApiError(401, 'Token inválido'));
    } else {
      next(error);
    }
  }
};

export const isAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'admin') {
    return next(new ApiError(403, 'Acceso denegado - Se requieren permisos de administrador'));
  }
  next();
};

export const isCliente = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'cliente') {
    return next(new ApiError(403, 'Acceso denegado - Solo clientes'));
  }
  next();
};

export const isAdminOrOwner = (clienteIdParam: string = 'clienteId') => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const clienteId = parseInt(req.params[clienteIdParam] || req.body[clienteIdParam]);
    
    if (req.user?.role === 'admin') {
      return next();
    }

    if (req.user?.role === 'cliente' && req.user.clienteId === clienteId) {
      return next();
    }

    next(new ApiError(403, 'Acceso denegado - No tiene permisos para este recurso'));
  };
};
