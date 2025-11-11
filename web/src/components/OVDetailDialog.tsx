import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ovApi, enviosApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency, formatDate } from '@/lib/utils';
import { FileText, Truck, FileDown } from 'lucide-react';

interface OVDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ovId: number;
}

export function OVDetailDialog({ open, onOpenChange, ovId }: OVDetailDialogProps) {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const [newEstado, setNewEstado] = useState('');
  const [showEnvioForm, setShowEnvioForm] = useState(false);
  const [carrier, setCarrier] = useState('');
  const [fechaSalida, setFechaSalida] = useState('');
  const [fechaEntregaEstimada, setFechaEntregaEstimada] = useState('');

  const { data: ov, isLoading } = useQuery({
    queryKey: ['ov-detail', ovId],
    queryFn: async () => {
      const res = await ovApi.getById(ovId);
      return res.data.data;
    },
    enabled: open && !!ovId,
  });

  const cambiarEstadoMutation = useMutation({
    mutationFn: async (estado: string) => {
      return await ovApi.changeEstado(ovId, estado);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordenes-venta'] });
      queryClient.invalidateQueries({ queryKey: ['ov-detail', ovId] });
      setNewEstado('');
    },
  });

  const crearEnvioMutation = useMutation({
    mutationFn: async (data: any) => {
      return await enviosApi.createFromOV(ovId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['envios'] });
      queryClient.invalidateQueries({ queryKey: ['ordenes-venta'] });
      queryClient.invalidateQueries({ queryKey: ['ov-detail', ovId] });
      setShowEnvioForm(false);
      setCarrier('');
      setFechaSalida('');
      setFechaEntregaEstimada('');
      alert('Envío creado exitosamente');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Error al crear el envío');
    },
  });

  const handleCambiarEstado = () => {
    if (newEstado && newEstado !== ov?.estado) {
      cambiarEstadoMutation.mutate(newEstado);
    }
  };

  const handleCrearEnvio = () => {
    if (!carrier.trim()) {
      alert('Por favor ingresa el nombre del carrier/transportadora');
      return;
    }

    const data: any = { carrier };
    if (fechaSalida) data.fechaSalida = fechaSalida;
    if (fechaEntregaEstimada) data.fechaEntregaEstimada = fechaEntregaEstimada;

    crearEnvioMutation.mutate(data);
  };

  const handleDownloadPDF = async () => {
    try {
      await ovApi.downloadPDF(ovId, ov?.codigoOv || `OV-${ovId}`);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error al descargar el PDF');
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Detalle de Orden de Venta
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadPDF}
              className="flex items-center gap-2"
            >
              <FileDown className="h-4 w-4" />
              Descargar PDF
            </Button>
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="text-center py-8">Cargando...</div>
        ) : ov ? (
          <div className="space-y-6">
            {/* Header Info */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="text-sm font-medium text-gray-600">Código OV</label>
                <p className="text-lg font-bold">{ov.codigoOv}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Estado</label>
                <div className="mt-1">
                  <Badge variant="estado" estado={ov.estado} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Fecha</label>
                <p>{formatDate(ov.createdAt)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Cliente</label>
                <p className="font-medium">{ov.cliente?.nombreLegal}</p>
              </div>
              {ov.ordenCompra && (
                <div>
                  <label className="text-sm font-medium text-gray-600">OC Asociada</label>
                  <p className="font-medium">{ov.ordenCompra.codigoOc}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-600">Total</label>
                <p className="text-lg font-bold text-green-600">
                  {formatCurrency(ov.total)} {ov.moneda}
                </p>
              </div>
            </div>

            {/* Notas */}
            {ov.notas && (
              <div>
                <label className="text-sm font-medium text-gray-600">Notas</label>
                <p className="mt-1 text-sm text-gray-700 p-3 bg-gray-50 rounded">{ov.notas}</p>
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
                  {ov.items?.map((item: any) => (
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

            {/* Envio Info */}
            {ov.envio && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Truck className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-blue-900">Información de Envío</h3>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="font-medium">Número:</span> {ov.envio.numeroEnvio}
                  </div>
                  <div>
                    <span className="font-medium">Carrier:</span> {ov.envio.carrier || '-'}
                  </div>
                  <div>
                    <span className="font-medium">Estado:</span>{' '}
                    <Badge variant="default">{ov.envio.estadoEnvio}</Badge>
                  </div>
                </div>
              </div>
            )}

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
                      value={newEstado || ov.estado}
                      onChange={(e) => setNewEstado(e.target.value)}
                    >
                      <option value="recibida">Recibida</option>
                      <option value="procesando">Procesando</option>
                      <option value="en_despacho">En Despacho</option>
                      <option value="procesada">Procesada</option>
                    </select>
                    <Button
                      size="sm"
                      onClick={handleCambiarEstado}
                      disabled={!newEstado || newEstado === ov.estado || cambiarEstadoMutation.isPending}
                    >
                      {cambiarEstadoMutation.isPending ? 'Actualizando...' : 'Actualizar'}
                    </Button>
                  </div>

                  {/* Crear Envío - Solo cuando estado es "en_despacho" y no hay envío */}
                  {ov.estado === 'en_despacho' && !ov.envio && (
                    <div className="mt-4 p-4 border rounded-lg bg-blue-50">
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <Truck className="h-4 w-4" />
                        Crear Envío
                      </h4>
                      {!showEnvioForm ? (
                        <Button
                          size="sm"
                          onClick={() => setShowEnvioForm(true)}
                          className="w-full"
                        >
                          Iniciar Creación de Envío
                        </Button>
                      ) : (
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-medium">
                              Carrier/Transportadora *
                            </label>
                            <Input
                              type="text"
                              value={carrier}
                              onChange={(e) => setCarrier(e.target.value)}
                              placeholder="Ej: DHL, FedEx, Correo Nacional"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">
                              Fecha de Salida
                            </label>
                            <Input
                              type="date"
                              value={fechaSalida}
                              onChange={(e) => setFechaSalida(e.target.value)}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">
                              Fecha Estimada de Entrega
                            </label>
                            <Input
                              type="date"
                              value={fechaEntregaEstimada}
                              onChange={(e) => setFechaEntregaEstimada(e.target.value)}
                              className="mt-1"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={handleCrearEnvio}
                              disabled={crearEnvioMutation.isPending}
                              className="flex-1"
                            >
                              {crearEnvioMutation.isPending ? 'Creando...' : 'Crear Envío'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setShowEnvioForm(false);
                                setCarrier('');
                                setFechaSalida('');
                                setFechaEntregaEstimada('');
                              }}
                            >
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
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
