import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usersApi, clientesApi } from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: any;
}

export function UserFormDialog({ open, onOpenChange, user }: UserFormDialogProps) {
  const queryClient = useQueryClient();
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'cliente'>('cliente');
  const [clienteId, setClienteId] = useState('');
  const [activo, setActivo] = useState(true);

  const isEditing = !!user;

  useEffect(() => {
    if (user && open) {
      setNombre(user.nombre || '');
      setEmail(user.email || '');
      setPassword('');
      setRole(user.role || 'cliente');
      setClienteId(user.clienteId?.toString() || '');
      setActivo(user.activo !== undefined ? user.activo : true);
    } else if (!open) {
      resetForm();
    }
  }, [user, open]);

  const { data: clientes } = useQuery({
    queryKey: ['clientes'],
    queryFn: async () => {
      const res = await clientesApi.getAll();
      return res.data.data;
    },
    enabled: open,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return await usersApi.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      onOpenChange(false);
      resetForm();
      alert('Usuario creado exitosamente');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Error al crear el usuario');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      return await usersApi.update(user.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      onOpenChange(false);
      resetForm();
      alert('Usuario actualizado exitosamente');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Error al actualizar el usuario');
    },
  });

  const resetForm = () => {
    setNombre('');
    setEmail('');
    setPassword('');
    setRole('cliente');
    setClienteId('');
    setActivo(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!nombre.trim() || !email.trim()) {
      alert('Nombre y email son requeridos');
      return;
    }

    if (!isEditing && !password) {
      alert('La contraseña es requerida para crear un usuario');
      return;
    }

    if (password && password.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (role === 'cliente' && !clienteId) {
      alert('Los usuarios de tipo cliente deben tener un cliente asignado');
      return;
    }

    const data: any = {
      nombre: nombre.trim(),
      email: email.trim(),
      role,
      clienteId: role === 'cliente' && clienteId ? parseInt(clienteId) : null,
      activo,
    };

    if (!isEditing) {
      data.password = password;
    }

    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Usuario' : 'Nuevo Usuario'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="nombre">Nombre Completo *</Label>
            <Input
              id="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Juan Pérez"
              required
            />
          </div>

          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@ejemplo.com"
              required
            />
          </div>

          {!isEditing && (
            <div>
              <Label htmlFor="password">Contraseña *</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                minLength={6}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Mínimo 6 caracteres
              </p>
            </div>
          )}

          {isEditing && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
              Para cambiar la contraseña, usa el botón de "Cambiar Contraseña" en la lista de usuarios.
            </div>
          )}

          <div>
            <Label htmlFor="role">Rol *</Label>
            <select
              id="role"
              className="w-full border rounded-md px-3 py-2"
              value={role}
              onChange={(e) => setRole(e.target.value as 'admin' | 'cliente')}
              required
            >
              <option value="cliente">Cliente</option>
              <option value="admin">Administrador</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {role === 'admin'
                ? 'Acceso completo a todas las funciones'
                : 'Acceso limitado a sus propias órdenes'}
            </p>
          </div>

          {role === 'cliente' && (
            <div>
              <Label htmlFor="clienteId">Cliente Asociado *</Label>
              <select
                id="clienteId"
                className="w-full border rounded-md px-3 py-2"
                value={clienteId}
                onChange={(e) => setClienteId(e.target.value)}
                required
              >
                <option value="">Seleccionar cliente</option>
                {clientes?.map((cliente: any) => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.nombreLegal} - {cliente.nit}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="activo"
              checked={activo}
              onChange={(e) => setActivo(e.target.checked)}
              className="w-4 h-4"
            />
            <Label htmlFor="activo">Usuario activo</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending
                ? 'Guardando...'
                : isEditing
                ? 'Actualizar'
                : 'Crear Usuario'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
