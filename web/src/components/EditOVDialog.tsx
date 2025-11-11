import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ovApi, clientesApi, productosApi } from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2 } from 'lucide-react';

interface EditOVDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ovId: number;
  ov: any;
}

interface OVItem {
  sku: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  productoId?: number | null;
}

export function EditOVDialog({ open, onOpenChange, ovId, ov }: EditOVDialogProps) {
  const queryClient = useQueryClient();
  const [clienteId, setClienteId] = useState('');
  const [notas, setNotas] = useState('');
  const [items, setItems] = useState<OVItem[]>([]);

  // Cargar datos iniciales cuando se abre el diálogo
  useEffect(() => {
    if (ov && open) {
      setClienteId(ov.clienteId?.toString() || '');
      setNotas(ov.notas || '');
      setItems(ov.items?.map((item: any) => ({
        sku: item.sku,
        descripcion: item.descripcion,
        cantidad: Number(item.cantidad),
        precioUnitario: Number(item.precioUnitario),
        productoId: item.productoId,
      })) || []);
    }
  }, [ov, open]);

  const { data: clientes } = useQuery({
    queryKey: ['clientes'],
    queryFn: async () => {
      const res = await clientesApi.getAll();
      return res.data.data;
    },
    enabled: open,
  });

  const { data: productos } = useQuery({
    queryKey: ['productos'],
    queryFn: async () => {
      const res = await productosApi.getAll();
      return res.data.data;
    },
    enabled: open,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      return await ovApi.update(ovId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordenes-venta'] });
      queryClient.invalidateQueries({ queryKey: ['ov-detail', ovId] });
      onOpenChange(false);
      alert('Orden de venta actualizada exitosamente');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Error al actualizar la orden de venta');
    },
  });

  const addItem = () => {
    setItems([...items, { sku: '', descripcion: '', cantidad: 1, precioUnitario: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof OVItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleProductoSelect = (index: number, sku: string) => {
    const producto = productos?.find((p: any) => p.sku === sku);
    if (producto) {
      updateItem(index, 'sku', producto.sku);
      updateItem(index, 'descripcion', producto.nombre);
      updateItem(index, 'precioUnitario', parseFloat(producto.precioBase));
      updateItem(index, 'productoId', producto.id);
    } else {
      updateItem(index, 'sku', sku);
    }
  };

  const calcularTotal = () => {
    return items.reduce((sum, item) => sum + (item.cantidad * item.precioUnitario), 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validación
    if (!clienteId) {
      alert('Por favor selecciona un cliente');
      return;
    }

    const hasEmptyItems = items.some(item => 
      !item.sku?.trim() || 
      !item.descripcion?.trim() || 
      item.precioUnitario === null || 
      item.precioUnitario === undefined ||
      isNaN(item.precioUnitario)
    );
    
    if (hasEmptyItems) {
      alert('Por favor completa todos los campos de los ítems (SKU, Descripción y Precio)');
      return;
    }
    
    const data = {
      clienteId: parseInt(clienteId),
      notas,
      items: items.map(item => ({
        sku: item.sku,
        descripcion: item.descripcion,
        cantidad: item.cantidad,
        precioUnitario: item.precioUnitario,
        productoId: item.productoId || null,
      })),
    };

    updateMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Orden de Venta - {ov?.codigoOv}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Código OV</label>
              <Input
                value={ov?.codigoOv || ''}
                disabled
                className="bg-gray-100"
              />
              <p className="text-xs text-gray-500 mt-1">El código no se puede modificar</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Cliente *</label>
              <select
                className="w-full border rounded-md px-3 py-2"
                value={clienteId}
                onChange={(e) => setClienteId(e.target.value)}
                required
              >
                <option value="">Seleccionar cliente</option>
                {clientes?.map((cliente: any) => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.nombreLegal}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Notas</label>
            <textarea
              className="w-full border rounded-md px-3 py-2"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={3}
              placeholder="Notas adicionales..."
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Ítems</h3>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="h-4 w-4 mr-1" /> Agregar Ítem
              </Button>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Ítem {index + 1}</span>
                    {items.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(index)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-4 gap-3">
                    <div>
                      <label className="block text-sm mb-1">SKU / Producto</label>
                      <Input
                        value={item.sku}
                        onChange={(e) => handleProductoSelect(index, e.target.value)}
                        list={`productos-list-edit-${index}`}
                        placeholder="Escribe o selecciona"
                        className="text-sm"
                      />
                      <datalist id={`productos-list-edit-${index}`}>
                        {productos?.map((producto: any) => (
                          <option key={producto.id} value={producto.sku}>
                            {producto.sku} - {producto.nombre}
                          </option>
                        ))}
                      </datalist>
                    </div>

                    <div>
                      <label className="block text-sm mb-1">Descripción</label>
                      <Input
                        value={item.descripcion}
                        onChange={(e) => updateItem(index, 'descripcion', e.target.value)}
                        placeholder="Descripción del producto"
                        className="text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm mb-1">Cantidad</label>
                      <Input
                        type="number"
                        min="1"
                        step="1"
                        value={item.cantidad}
                        onChange={(e) => updateItem(index, 'cantidad', parseInt(e.target.value) || 1)}
                        className="text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm mb-1">Precio Unit.</label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.precioUnitario}
                        onChange={(e) => updateItem(index, 'precioUnitario', parseFloat(e.target.value) || 0)}
                        className="text-sm"
                      />
                    </div>
                  </div>

                  <div className="text-right text-sm">
                    <span className="font-medium">Subtotal: </span>
                    <span>$ {(item.cantidad * item.precioUnitario).toLocaleString('es-CO', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="text-right text-lg font-bold">
              Total: $ {calcularTotal().toLocaleString('es-CO', { minimumFractionDigits: 2 })}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
