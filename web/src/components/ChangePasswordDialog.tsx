import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Key } from 'lucide-react';

interface ChangePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId?: number;
  userName?: string;
}

export function ChangePasswordDialog({ open, onOpenChange, userId, userName }: ChangePasswordDialogProps) {
  const queryClient = useQueryClient();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const changePasswordMutation = useMutation({
    mutationFn: async (data: { userId: number; newPassword: string }) => {
      return await usersApi.changePassword(data.userId, data.newPassword);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      onOpenChange(false);
      setNewPassword('');
      setConfirmPassword('');
      alert('Contraseña actualizada exitosamente');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Error al cambiar la contraseña');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || newPassword.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }

    if (!userId) {
      alert('Error: No se ha seleccionado un usuario');
      return;
    }

    changePasswordMutation.mutate({ userId, newPassword });
  };

  const handleClose = () => {
    setNewPassword('');
    setConfirmPassword('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Cambiar Contraseña
          </DialogTitle>
        </DialogHeader>

        {userName && (
          <div className="p-3 bg-gray-50 border border-gray-200 rounded">
            <p className="text-sm text-gray-600">Usuario:</p>
            <p className="font-medium">{userName}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="newPassword">Nueva Contraseña *</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              minLength={6}
              required
            />
          </div>

          <div>
            <Label htmlFor="confirmPassword">Confirmar Contraseña *</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repite la contraseña"
              minLength={6}
              required
            />
          </div>

          {newPassword && confirmPassword && newPassword !== confirmPassword && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
              Las contraseñas no coinciden
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={changePasswordMutation.isPending || newPassword !== confirmPassword}
            >
              {changePasswordMutation.isPending ? 'Cambiando...' : 'Cambiar Contraseña'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
