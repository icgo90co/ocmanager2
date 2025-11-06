import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { clientesApi } from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ClienteFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cliente?: any;
}

export function ClienteForm({ open, onOpenChange, cliente }: ClienteFormProps) {
  const queryClient = useQueryClient();
  const isEdit = !!cliente;
  
  const [formData, setFormData] = useState({
    nombreLegal: cliente?.nombreLegal || '',
    nit: cliente?.nit || '',
    email: cliente?.email || '',
    telefono: cliente?.telefono || '',
    direccion: cliente?.direccion || '',
    ciudad: cliente?.ciudad || '',
    pais: cliente?.pais || 'Colombia',
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return isEdit 
        ? await clientesApi.update(cliente.id, data)
        : await clientesApi.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      onOpenChange(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar Cliente' : 'Nuevo Cliente'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Nombre Legal *</label>
              <Input
                value={formData.nombreLegal}
                onChange={(e) => setFormData({ ...formData, nombreLegal: e.target.value })}
                placeholder="Acme Inc."
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">NIT *</label>
              <Input
                value={formData.nit}
                onChange={(e) => setFormData({ ...formData, nit: e.target.value })}
                placeholder="900123456-7"
                required
                disabled={isEdit}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email *</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="contacto@empresa.com"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Teléfono</label>
              <Input
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                placeholder="+57 310 1234567"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Dirección</label>
            <Input
              value={formData.direccion}
              onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
              placeholder="Calle 100 #15-20"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Ciudad</label>
              <Input
                value={formData.ciudad}
                onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                placeholder="Bogotá"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">País</label>
              <Input
                value={formData.pais}
                onChange={(e) => setFormData({ ...formData, pais: e.target.value })}
                placeholder="Colombia"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Guardando...' : isEdit ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
