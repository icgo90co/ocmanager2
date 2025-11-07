import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ocApi, clientesApi, productosApi } from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2 } from 'lucide-react';

interface OrdenCompraFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface OCItem {
  sku: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
}

export function OrdenCompraForm({ open, onOpenChange }: OrdenCompraFormProps) {
  const queryClient = useQueryClient();
  const [codigoOc, setCodigoOc] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [notas, setNotas] = useState('');
  const [items, setItems] = useState<OCItem[]>([
    { sku: '', descripcion: '', cantidad: 1, precioUnitario: 0 },
  ]);

  const { data: clientes } = useQuery({
    queryKey: ['clientes'],
    queryFn: async () => {
      const res = await clientesApi.getAll();
      return res.data.data;
    },
  });

  const { data: productos } = useQuery({
    queryKey: ['productos'],
    queryFn: async () => {
      const res = await productosApi.getAll();
      return res.data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return await ocApi.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordenes-compra'] });
      onOpenChange(false);
      resetForm();
    },
  });

  const resetForm = () => {
    setCodigoOc('');
    setClienteId('');
    setNotas('');
    setItems([{ sku: '', descripcion: '', cantidad: 1, precioUnitario: 0 }]);
  };

  const addItem = () => {
    setItems([...items, { sku: '', descripcion: '', cantidad: 1, precioUnitario: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof OCItem, value: any) => {
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
    } else {
      // Si no encuentra el producto, solo actualiza el SKU (producto personalizado)
      updateItem(index, 'sku', sku);
    }
  };

  const calcularTotal = () => {
    return items.reduce((sum, item) => sum + (item.cantidad * item.precioUnitario), 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      codigoOc,
      clienteId: parseInt(clienteId),
      total: calcularTotal(),
      moneda: 'COP',
      estado: 'recibida',
      notas,
      origen: 'manual',
      items: items.map(item => ({
        sku: item.sku,
        descripcion: item.descripcion,
        cantidad: item.cantidad,
        precioUnitario: item.precioUnitario,
        subtotal: item.cantidad * item.precioUnitario,
      })),
    };

    createMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva Orden de Compra</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Código OC</label>
              <Input
                value={codigoOc}
                onChange={(e) => setCodigoOc(e.target.value)}
                placeholder="OC-2024-00003"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Cliente</label>
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
                        list={`productos-list-${index}`}
                        placeholder="Escribe o selecciona"
                        required
                        className="text-sm"
                      />
                      <datalist id={`productos-list-${index}`}>
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
                        required
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
                        required
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
                        required
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
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creando...' : 'Crear Orden'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
