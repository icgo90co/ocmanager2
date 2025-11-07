import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { enviosApi } from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Truck, Package, MapPin } from 'lucide-react';

interface EnvioDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  envioId: number;
}

export function EnvioDetailDialog({ open, onOpenChange, envioId }: EnvioDetailDialogProps) {
  const queryClient = useQueryClient();
  const [newEstado, setNewEstado] = useState('');
  const [observaciones, setObservaciones] = useState('');

  const { data: envio, isLoading } = useQuery({
    queryKey: ['envio-detail', envioId],
    queryFn: async () => {
      const res = await enviosApi.getById(envioId);
      return res.data.data;
    },
    enabled: open && !!envioId,
  });

  const actualizarEstadoMutation = useMutation({
    mutationFn: async (data: { estado: string; observaciones: string }) => {
      return await enviosApi.updateEstado(envioId, data.estado, data.observaciones);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['envios'] });
      queryClient.invalidateQueries({ queryKey: ['envio-detail', envioId] });
      setNewEstado('');
      setObservaciones('');
    },
  });

  const handleActualizarEstado = () => {
    if (newEstado && newEstado !== envio?.estadoEnvio) {
      actualizarEstadoMutation.mutate({ estado: newEstado, observaciones });
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Detalle de Envío
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="text-center py-8">Cargando...</div>
        ) : envio ? (
          <div className="space-y-6">
            {/* Header Info */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="text-sm font-medium text-gray-600">Número de Envío</label>
                <p className="text-lg font-bold">{envio.numeroEnvio}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Estado</label>
                <div className="mt-1">
                  <Badge variant="default">{envio.estadoEnvio}</Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">OV Asociada</label>
                <p className="font-medium">{envio.ordenVenta?.codigoOv}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Cliente</label>
                <p>{envio.ordenVenta?.cliente?.nombreLegal}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Carrier</label>
                <p className="font-medium">{envio.carrier || 'No asignado'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Tracking Number</label>
                <p className="font-mono text-sm">{envio.trackingNumber || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Fecha Envío</label>
                <p>{envio.fechaEnvio ? formatDate(envio.fechaEnvio) : '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Fecha Entrega Estimada</label>
                <p>{envio.fechaEntregaEstimada ? formatDate(envio.fechaEntregaEstimada) : '-'}</p>
              </div>
            </div>

            {/* Direccion */}
            {envio.direccionEntrega && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-blue-900">Dirección de Entrega</h3>
                </div>
                <p className="text-sm">{envio.direccionEntrega}</p>
              </div>
            )}

            {/* Items */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Package className="h-5 w-5" />
                Ítems del Envío
              </h3>
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
                  {envio.ordenVenta?.items?.map((item: any) => (
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
                  <TableRow>
                    <TableCell colSpan={4} className="text-right font-bold">Total:</TableCell>
                    <TableCell className="text-right font-bold text-green-600">
                      {formatCurrency(envio.ordenVenta?.total)} {envio.ordenVenta?.moneda}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            {/* Eventos de seguimiento */}
            {envio.eventos && envio.eventos.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Seguimiento</h3>
                <div className="space-y-2">
                  {envio.eventos.map((evento: any) => (
                    <div key={evento.id} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0 w-2 h-2 mt-1.5 rounded-full bg-blue-600"></div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium text-sm">{evento.estado}</p>
                          <span className="text-xs text-gray-500">{formatDate(evento.fecha)}</span>
                        </div>
                        {evento.ubicacion && (
                          <p className="text-xs text-gray-600">📍 {evento.ubicacion}</p>
                        )}
                        {evento.observaciones && (
                          <p className="text-xs text-gray-700 mt-1">{evento.observaciones}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="border-t pt-4 space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-3">Actualizar Estado</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-medium min-w-[100px]">Nuevo Estado:</label>
                    <select
                      className="border rounded-md px-3 py-1.5 text-sm flex-1"
                      value={newEstado || envio.estadoEnvio}
                      onChange={(e) => setNewEstado(e.target.value)}
                    >
                      <option value="pendiente">Pendiente</option>
                      <option value="en_transito">En Tránsito</option>
                      <option value="en_distribucion">En Distribución</option>
                      <option value="entregado">Entregado</option>
                      <option value="devuelto">Devuelto</option>
                      <option value="cancelado">Cancelado</option>
                    </select>
                  </div>

                  <div className="flex items-start gap-3">
                    <label className="text-sm font-medium min-w-[100px] mt-2">Observaciones:</label>
                    <textarea
                      className="border rounded-md px-3 py-2 text-sm flex-1"
                      rows={2}
                      value={observaciones}
                      onChange={(e) => setObservaciones(e.target.value)}
                      placeholder="Agregar detalles sobre el cambio de estado..."
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button
                      onClick={handleActualizarEstado}
                      disabled={!newEstado || newEstado === envio.estadoEnvio || actualizarEstadoMutation.isPending}
                    >
                      {actualizarEstadoMutation.isPending ? 'Actualizando...' : 'Actualizar Estado'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cerrar
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">No se pudo cargar el envío</div>
        )}
      </DialogContent>
    </Dialog>
  );
}
