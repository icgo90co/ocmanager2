import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { productosApi } from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ProductoFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  producto?: any;
}

export function ProductoForm({ open, onOpenChange, producto }: ProductoFormProps) {
  const queryClient = useQueryClient();
  const isEdit = !!producto;
  
  const [formData, setFormData] = useState({
    sku: producto?.sku || '',
    nombre: producto?.nombre || '',
    descripcion: producto?.descripcion || '',
    unidad: producto?.unidad || 'UND',
    precioBase: producto?.precioBase || 0,
    activo: producto?.activo ?? true,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return isEdit 
        ? await productosApi.update(producto.id, data)
        : await productosApi.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos'] });
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
          <DialogTitle>{isEdit ? 'Editar Producto' : 'Nuevo Producto'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">SKU *</label>
              <Input
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                placeholder="PROD-001"
                required
                disabled={isEdit}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Unidad</label>
              <select
                className="w-full border rounded-md px-3 py-2"
                value={formData.unidad}
                onChange={(e) => setFormData({ ...formData, unidad: e.target.value })}
              >
                <option value="UND">Unidad</option>
                <option value="KG">Kilogramo</option>
                <option value="MT">Metro</option>
                <option value="LT">Litro</option>
                <option value="CAJA">Caja</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Nombre *</label>
            <Input
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              placeholder="Nombre del producto"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Descripción</label>
            <textarea
              className="w-full border rounded-md px-3 py-2"
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              rows={3}
              placeholder="Descripción detallada del producto..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Precio Base *</label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={formData.precioBase}
              onChange={(e) => setFormData({ ...formData, precioBase: parseFloat(e.target.value) })}
              placeholder="0.00"
              required
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="activo"
              checked={formData.activo}
              onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
              className="rounded"
            />
            <label htmlFor="activo" className="text-sm font-medium">Producto activo</label>
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
