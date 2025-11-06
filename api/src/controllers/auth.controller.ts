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

    logger.info(`Login attempt for email: ${email}`);

    if (!email || !password) {
      throw new ApiError(400, 'Email y contraseña son requeridos');
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { cliente: true },
    });

    if (!user || !user.activo) {
      logger.warn(`Login failed: user not found or inactive - ${email}`);
      throw new ApiError(401, 'Credenciales inválidas');
    }

    const isValidPassword = await bcrypt.compare(password, user.hashPassword);

    if (!isValidPassword) {
      logger.warn(`Login failed: invalid password - ${email}`);
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
      { expiresIn: '7d' }
    );

    // Cookie configuration for cross-domain setup
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // 'none' required for cross-domain
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
    });

    logger.info(`User logged in successfully: ${user.email}`);

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
    logger.error(`Login error: ${error}`);
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
      select: {
        id: true,
        nombre: true,
        email: true,
        role: true,
        clienteId: true,
        activo: true,
        cliente: {
          select: {
            id: true,
            nombreLegal: true,
            email: true,
            telefono: true,
          },
        },
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
