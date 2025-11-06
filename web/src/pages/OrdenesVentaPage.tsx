import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ovApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Plus, Eye } from 'lucide-react';
import { OrdenVentaForm } from '@/components/OrdenVentaForm';

export default function OrdenesVentaPage() {
  const [search, setSearch] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  const { data: ordenes, isLoading } = useQuery({
    queryKey: ['ordenes-venta', search],
    queryFn: async () => {
      const res = await ovApi.getAll({ codigoOv: search });
      return res.data.data;
    },
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Órdenes de Venta</h1>
          <p className="text-gray-600 mt-2">
            Crea y gestiona órdenes de venta.
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva OV
        </Button>
      </div>

      <OrdenVentaForm open={showCreateForm} onOpenChange={setShowCreateForm} />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Mis Órdenes de Venta</CardTitle>
            <Input
              placeholder="Buscar por ID de Orden"
              value={search}
              onChange={(e: any) => setSearch(e.target.value)}
              className="w-64"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Cargando...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID de Orden</TableHead>
                  <TableHead>OC Asociada</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Monto Total</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ordenes?.map((orden: any) => (
                  <TableRow key={orden.id}>
                    <TableCell className="font-medium">{orden.codigoOv}</TableCell>
                    <TableCell>{orden.ordenCompra?.codigoOc || '-'}</TableCell>
                    <TableCell>{formatDate(orden.createdAt)}</TableCell>
                    <TableCell>{orden.cliente?.nombreLegal}</TableCell>
                    <TableCell>
                      <Badge variant="estado" estado={orden.estado} />
                    </TableCell>
                    <TableCell>{formatCurrency(orden.total)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
