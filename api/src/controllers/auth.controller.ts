import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { AuthRequest } from '../middleware/auth';
import { ApiError } from '../middleware/errorHandler';
import prisma from '../utils/prisma';
import { logger } from '../utils/logger';

export const login = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ApiError(400, 'Email y contraseña son requeridos');
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { cliente: true },
    });

    if (!user || !user.activo) {
      throw new ApiError(401, 'Credenciales inválidas');
    }

    const isValidPassword = await bcrypt.compare(password, user.hashPassword);

    if (!isValidPassword) {
      throw new ApiError(401, 'Credenciales inválidas');
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        clienteId: user.clienteId,
      },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
    });

    logger.info(`User logged in: ${user.email}`);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          nombre: user.nombre,
          email: user.email,
          role: user.role,
          clienteId: user.clienteId,
          cliente: user.cliente,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logout = (req: AuthRequest, res: Response) => {
  res.clearCookie('token');
  res.json({ success: true, message: 'Sesión cerrada exitosamente' });
};

export const me = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

    if (!token) {
      throw new ApiError(401, 'No autorizado');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: number;
    };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { cliente: true },
      select: {
        id: true,
        nombre: true,
        email: true,
        role: true,
        clienteId: true,
        activo: true,
        cliente: true,
      },
    });

    if (!user || !user.activo) {
      throw new ApiError(401, 'Usuario no autorizado');
    }

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};
