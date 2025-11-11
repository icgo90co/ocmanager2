import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { ApiError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import bcrypt from 'bcrypt';

export const getAll = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        nombre: true,
        email: true,
        role: true,
        clienteId: true,
        activo: true,
        createdAt: true,
        updatedAt: true,
        cliente: {
          select: {
            id: true,
            nombreLegal: true,
            nit: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

export const getById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        nombre: true,
        email: true,
        role: true,
        clienteId: true,
        activo: true,
        createdAt: true,
        updatedAt: true,
        cliente: {
          select: {
            id: true,
            nombreLegal: true,
            nit: true,
          },
        },
      },
    });

    if (!user) {
      throw new ApiError(404, 'Usuario no encontrado');
    }

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

export const create = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { nombre, email, password, role, clienteId, activo } = req.body;

    // Validaciones
    if (!nombre || !email || !password) {
      throw new ApiError(400, 'Nombre, email y contraseña son requeridos');
    }

    if (!['admin', 'cliente'].includes(role)) {
      throw new ApiError(400, 'Role debe ser admin o cliente');
    }

    if (role === 'cliente' && !clienteId) {
      throw new ApiError(400, 'Los usuarios de tipo cliente deben tener un clienteId asignado');
    }

    // Verificar si el email ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ApiError(400, 'El email ya está registrado');
    }

    // Si es cliente, verificar que el cliente existe
    if (clienteId) {
      const cliente = await prisma.cliente.findUnique({
        where: { id: clienteId },
      });

      if (!cliente) {
        throw new ApiError(404, 'Cliente no encontrado');
      }
    }

    // Hash de la contraseña
    const hashPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        nombre,
        email,
        hashPassword,
        role,
        clienteId: clienteId || null,
        activo: activo !== undefined ? activo : true,
      },
      select: {
        id: true,
        nombre: true,
        email: true,
        role: true,
        clienteId: true,
        activo: true,
        createdAt: true,
        cliente: {
          select: {
            id: true,
            nombreLegal: true,
            nit: true,
          },
        },
      },
    });

    // Registrar en audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        entidad: 'User',
        entidadId: user.id,
        accion: 'CREATE',
        diffJson: JSON.stringify({
          nombre: user.nombre,
          email: user.email,
          role: user.role,
          clienteId: user.clienteId,
        }),
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });

    res.status(201).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

export const update = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { nombre, email, role, clienteId, activo } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
    });

    if (!user) {
      throw new ApiError(404, 'Usuario no encontrado');
    }

    // No permitir que un usuario se desactive a sí mismo
    if (req.user!.id === parseInt(id) && activo === false) {
      throw new ApiError(400, 'No puedes desactivar tu propia cuenta');
    }

    // Validar role
    if (role && !['admin', 'cliente'].includes(role)) {
      throw new ApiError(400, 'Role debe ser admin o cliente');
    }

    // Si el role es cliente, debe tener clienteId
    if (role === 'cliente' && !clienteId && !user.clienteId) {
      throw new ApiError(400, 'Los usuarios de tipo cliente deben tener un clienteId asignado');
    }

    // Verificar email único si se está cambiando
    if (email && email !== user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw new ApiError(400, 'El email ya está registrado');
      }
    }

    // Si se especifica clienteId, verificar que existe
    if (clienteId) {
      const cliente = await prisma.cliente.findUnique({
        where: { id: clienteId },
      });

      if (!cliente) {
        throw new ApiError(404, 'Cliente no encontrado');
      }
    }

    const updateData: any = {};
    if (nombre !== undefined) updateData.nombre = nombre;
    if (email !== undefined) updateData.email = email;
    if (role !== undefined) updateData.role = role;
    if (clienteId !== undefined) updateData.clienteId = clienteId;
    if (activo !== undefined) updateData.activo = activo;

    const updated = await prisma.user.update({
      where: { id: parseInt(id) },
      data: updateData,
      select: {
        id: true,
        nombre: true,
        email: true,
        role: true,
        clienteId: true,
        activo: true,
        createdAt: true,
        updatedAt: true,
        cliente: {
          select: {
            id: true,
            nombreLegal: true,
            nit: true,
          },
        },
      },
    });

    // Registrar en audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        entidad: 'User',
        entidadId: user.id,
        accion: 'UPDATE',
        diffJson: JSON.stringify({
          before: {
            nombre: user.nombre,
            email: user.email,
            role: user.role,
            clienteId: user.clienteId,
            activo: user.activo,
          },
          after: updateData,
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

export const changePassword = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      throw new ApiError(400, 'La contraseña debe tener al menos 6 caracteres');
    }

    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
    });

    if (!user) {
      throw new ApiError(404, 'Usuario no encontrado');
    }

    const hashPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: parseInt(id) },
      data: { hashPassword },
    });

    // Registrar en audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        entidad: 'User',
        entidadId: user.id,
        accion: 'CHANGE_PASSWORD',
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });

    res.json({ success: true, message: 'Contraseña actualizada exitosamente' });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
    });

    if (!user) {
      throw new ApiError(404, 'Usuario no encontrado');
    }

    // No permitir que un usuario se elimine a sí mismo
    if (req.user!.id === parseInt(id)) {
      throw new ApiError(400, 'No puedes eliminar tu propia cuenta');
    }

    // En lugar de eliminar, desactivar el usuario
    await prisma.user.update({
      where: { id: parseInt(id) },
      data: { activo: false },
    });

    // Registrar en audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        entidad: 'User',
        entidadId: user.id,
        accion: 'DELETE',
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });

    res.json({ success: true, message: 'Usuario desactivado exitosamente' });
  } catch (error) {
    next(error);
  }
};
