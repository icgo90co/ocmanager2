import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { enviosApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDate } from '@/lib/utils';
import { Eye, Package } from 'lucide-react';

export default function EnviosPage() {
  const [search, setSearch] = useState('');

  const { data: envios, isLoading } = useQuery({
    queryKey: ['envios', search],
    queryFn: async () => {
      const res = await enviosApi.getAll({ numeroEnvio: search });
      return res.data.data;
    },
  });

  const getEstadoBadgeVariant = (estado: string) => {
    const variants: Record<string, string> = {
      preparando: 'secondary',
      en_transito: 'default',
      retenido: 'destructive',
      entregado: 'success',
      devuelto: 'destructive',
    };
    return variants[estado] || 'default';
  };

  const getEstadoLabel = (estado: string) => {
    const labels: Record<string, string> = {
      preparando: 'Preparando',
      en_transito: 'En Tránsito',
      retenido: 'Retenido',
      entregado: 'Entregado',
      devuelto: 'Devuelto',
    };
    return labels[estado] || estado;
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Envíos</h1>
          <p className="text-gray-600 mt-2">
            Rastrea y gestiona todos los envíos.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Envíos Activos</CardTitle>
            <Input
              placeholder="Buscar por número de envío"
              value={search}
              onChange={(e: any) => setSearch(e.target.value)}
              className="w-64"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Cargando...</div>
          ) : envios && envios.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número de Envío</TableHead>
                  <TableHead>OV Asociada</TableHead>
                  <TableHead>Carrier</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha Salida</TableHead>
                  <TableHead>Entrega Estimada</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {envios.map((envio: any) => (
                  <TableRow key={envio.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-gray-500" />
                        {envio.numeroEnvio}
                      </div>
                    </TableCell>
                    <TableCell>{envio.ordenVenta?.codigoOv || '-'}</TableCell>
                    <TableCell>{envio.carrier || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={getEstadoBadgeVariant(envio.estadoEnvio) as any}>
                        {getEstadoLabel(envio.estadoEnvio)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {envio.fechaSalida ? formatDate(envio.fechaSalida) : '-'}
                    </TableCell>
                    <TableCell>
                      {envio.fechaEntregaEstimada ? formatDate(envio.fechaEntregaEstimada) : '-'}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium">No hay envíos disponibles</p>
              <p className="text-sm mt-2">Los envíos se crean automáticamente cuando una OV es marcada como "enviada"</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
