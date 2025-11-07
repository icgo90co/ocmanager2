import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { enviosApi, ovApi } from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Truck } from 'lucide-react';

interface EnvioFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EnvioForm({ open, onOpenChange }: EnvioFormProps) {
  const queryClient = useQueryClient();
  const [ovId, setOvId] = useState('');
  const [carrier, setCarrier] = useState('');
  const [fechaSalida, setFechaSalida] = useState('');
  const [fechaEntregaEstimada, setFechaEntregaEstimada] = useState('');

  const { data: ordenesVenta } = useQuery({
    queryKey: ['ordenes-venta-sin-envio'],
    queryFn: async () => {
      const res = await ovApi.getAll();
      // Filtrar solo las OV que están en estado 'en_despacho' y no tienen envío asociado
      return res.data.data.filter((ov: any) => ov.estado === 'en_despacho' && !ov.envio);
    },
    enabled: open,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return await enviosApi.createFromOV(parseInt(ovId), data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['envios'] });
      queryClient.invalidateQueries({ queryKey: ['ordenes-venta'] });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Error al crear el envío');
    },
  });

  const resetForm = () => {
    setOvId('');
    setCarrier('');
    setFechaSalida('');
    setFechaEntregaEstimada('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const data: any = {
      carrier,
    };

    if (fechaSalida) {
      data.fechaSalida = fechaSalida;
    }

    if (fechaEntregaEstimada) {
      data.fechaEntregaEstimada = fechaEntregaEstimada;
    }

    createMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Crear Nuevo Envío
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Orden de Venta</label>
            <select
              className="w-full border rounded-md px-3 py-2"
              value={ovId}
              onChange={(e) => setOvId(e.target.value)}
              required
            >
              <option value="">Seleccionar OV para enviar</option>
              {ordenesVenta?.map((ov: any) => (
                <option key={ov.id} value={ov.id}>
                  {ov.codigoOv} - {ov.cliente?.nombreLegal} (Total: ${ov.total.toLocaleString()})
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Solo se muestran OV en estado "enviada" sin envío asociado
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Carrier / Transportadora</label>
            <Input
              value={carrier}
              onChange={(e) => setCarrier(e.target.value)}
              placeholder="Ej: DHL, FedEx, Coordinadora"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Fecha de Salida</label>
              <Input
                type="date"
                value={fechaSalida}
                onChange={(e) => setFechaSalida(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Fecha Entrega Estimada</label>
              <Input
                type="date"
                value={fechaEntregaEstimada}
                onChange={(e) => setFechaEntregaEstimada(e.target.value)}
              />
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-sm text-blue-800">
              ℹ️ El número de envío se generará automáticamente. El estado inicial será "preparando".
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                resetForm();
              }}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creando...' : 'Crear Envío'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
