import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ocApi, ovApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency, formatDate } from '@/lib/utils';
import { FileText, Package } from 'lucide-react';

interface OCDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ocId: number;
}

export function OCDetailDialog({ open, onOpenChange, ocId }: OCDetailDialogProps) {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const [newEstado, setNewEstado] = useState('');

  const { data: oc, isLoading } = useQuery({
    queryKey: ['oc-detail', ocId],
    queryFn: async () => {
      const res = await ocApi.getById(ocId);
      return res.data.data;
    },
    enabled: open && !!ocId,
  });

  const cambiarEstadoMutation = useMutation({
    mutationFn: async (estado: string) => {
      return await ocApi.changeEstado(ocId, estado);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordenes-compra'] });
      queryClient.invalidateQueries({ queryKey: ['oc-detail', ocId] });
      setNewEstado('');
    },
  });

  const generarOVMutation = useMutation({
    mutationFn: async () => {
      return await ovApi.createFromOC(ocId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordenes-venta'] });
      alert('Orden de Venta generada exitosamente');
    },
  });

  const handleCambiarEstado = () => {
    if (newEstado && newEstado !== oc?.estado) {
      cambiarEstadoMutation.mutate(newEstado);
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Detalle de Orden de Compra
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="text-center py-8">Cargando...</div>
        ) : oc ? (
          <div className="space-y-6">
            {/* Header Info */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="text-sm font-medium text-gray-600">Código OC</label>
                <p className="text-lg font-bold">{oc.codigoOc}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Estado</label>
                <div className="mt-1">
                  <Badge variant="estado" estado={oc.estado} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Cliente</label>
                <p className="font-medium">{oc.cliente?.nombreLegal}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Fecha</label>
                <p>{formatDate(oc.createdAt)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Origen</label>
                <p className="capitalize">{oc.origen}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Total</label>
                <p className="text-lg font-bold text-blue-600">
                  {formatCurrency(oc.total)} {oc.moneda}
                </p>
              </div>
            </div>

            {/* Notas */}
            {oc.notas && (
              <div>
                <label className="text-sm font-medium text-gray-600">Notas</label>
                <p className="mt-1 text-sm text-gray-700 p-3 bg-gray-50 rounded">{oc.notas}</p>
              </div>
            )}

            {/* Items */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Ítems de la Orden</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-right">Cantidad</TableHead>
                    <TableHead className="text-right">Precio Unit.</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {oc.items?.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.sku}</TableCell>
                      <TableCell>{item.descripcion}</TableCell>
                      <TableCell className="text-right">{item.cantidad}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.precioUnitario)}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(item.subtotal)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Actions - Solo para administradores */}
            {user?.role === 'admin' && (
              <div className="border-t pt-4 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Acciones</h3>
                  
                  {/* Change Estado */}
                  <div className="flex items-center gap-3 mb-3">
                    <label className="text-sm font-medium">Cambiar Estado:</label>
                    <select
                      className="border rounded-md px-3 py-1.5 text-sm"
                      value={newEstado || oc.estado}
                      onChange={(e) => setNewEstado(e.target.value)}
                    >
                      <option value="recibida">Recibida</option>
                      <option value="en_proceso">En Proceso</option>
                      <option value="enviada">Enviada</option>
                      <option value="finalizada">Finalizada</option>
                      <option value="cancelada">Cancelada</option>
                    </select>
                    <Button
                      size="sm"
                      onClick={handleCambiarEstado}
                      disabled={!newEstado || newEstado === oc.estado || cambiarEstadoMutation.isPending}
                    >
                      {cambiarEstadoMutation.isPending ? 'Actualizando...' : 'Actualizar'}
                    </Button>
                  </div>

                  {/* Generate OV */}
                  <Button
                    variant="outline"
                    onClick={() => generarOVMutation.mutate()}
                    disabled={generarOVMutation.isPending || oc.estado === 'cancelada'}
                    className="w-full sm:w-auto"
                  >
                    <Package className="h-4 w-4 mr-2" />
                    {generarOVMutation.isPending ? 'Generando...' : 'Generar Orden de Venta'}
                  </Button>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cerrar
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">No se pudo cargar la orden</div>
        )}
      </DialogContent>
    </Dialog>
  );
}
