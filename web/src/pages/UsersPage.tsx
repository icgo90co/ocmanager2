import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDate } from '@/lib/utils';
import { Plus, Edit2, Trash2, Key, UserCheck, UserX } from 'lucide-react';
import { UserFormDialog } from '@/components/UserFormDialog';
import { ChangePasswordDialog } from '@/components/ChangePasswordDialog';

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await usersApi.getAll();
      return res.data.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await usersApi.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      alert('Usuario desactivado exitosamente');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Error al desactivar el usuario');
    },
  });

  const handleDelete = (user: any) => {
    if (confirm(`¿Estás seguro de que deseas desactivar al usuario "${user.nombre}"?`)) {
      deleteMutation.mutate(user.id);
    }
  };

  const handleEdit = (user: any) => {
    setSelectedUser(user);
    setShowCreateForm(true);
  };

  const handleChangePassword = (user: any) => {
    setSelectedUser(user);
    setShowPasswordDialog(true);
  };

  const filteredUsers = users?.filter((user: any) =>
    user.nombre.toLowerCase().includes(search.toLowerCase()) ||
    user.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Usuarios</h1>
          <p className="text-gray-600 mt-2">
            Administra los usuarios y sus permisos de acceso al sistema.
          </p>
        </div>
        <Button onClick={() => { setSelectedUser(null); setShowCreateForm(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Usuario
        </Button>
      </div>

      <UserFormDialog
        open={showCreateForm}
        onOpenChange={(open) => {
          setShowCreateForm(open);
          if (!open) setSelectedUser(null);
        }}
        user={selectedUser}
      />

      <ChangePasswordDialog
        open={showPasswordDialog}
        onOpenChange={(open) => {
          setShowPasswordDialog(open);
          if (!open) setSelectedUser(null);
        }}
        userId={selectedUser?.id}
        userName={selectedUser?.nombre}
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Lista de Usuarios</CardTitle>
            <Input
              placeholder="Buscar por nombre o email..."
              value={search}
              onChange={(e: any) => setSearch(e.target.value)}
              className="w-80"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Cargando...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha de Creación</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers?.map((user: any) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.nombre}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                        {user.role === 'admin' ? 'Administrador' : 'Cliente'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.cliente ? user.cliente.nombreLegal : '-'}
                    </TableCell>
                    <TableCell>
                      {user.activo ? (
                        <Badge variant="default" className="bg-green-500">
                          <UserCheck className="h-3 w-3 mr-1" />
                          Activo
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <UserX className="h-3 w-3 mr-1" />
                          Inactivo
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(user.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(user)}
                          title="Editar usuario"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleChangePassword(user)}
                          title="Cambiar contraseña"
                        >
                          <Key className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(user)}
                          title="Desactivar usuario"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
