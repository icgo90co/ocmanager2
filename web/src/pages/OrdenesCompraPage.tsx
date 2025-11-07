import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ocApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Plus, Upload, Eye } from 'lucide-react';
import { OrdenCompraForm } from '@/components/OrdenCompraForm';
import { OCDetailDialog } from '@/components/OCDetailDialog';

export default function OrdenesCompraPage() {
  const user = useAuthStore((state) => state.user);
  const [search, setSearch] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedOcId, setSelectedOcId] = useState<number | null>(null);

  const { data: ordenes, isLoading } = useQuery({
    queryKey: ['ordenes-compra', search],
    queryFn: async () => {
      const res = await ocApi.getAll({ codigoOc: search });
      return res.data.data;
    },
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Órdenes de Compra</h1>
          <p className="text-gray-600 mt-2">
            Crea, visualice y gestione todas las órdenes de compra.
          </p>
        </div>
        {user?.role === 'admin' && (
          <div className="flex gap-3">
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Subir Archivo
            </Button>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Orden
            </Button>
          </div>
        )}
      </div>

      <OrdenCompraForm open={showCreateForm} onOpenChange={setShowCreateForm} />
      <OCDetailDialog 
        open={!!selectedOcId} 
        onOpenChange={(open) => !open && setSelectedOcId(null)}
        ocId={selectedOcId || 0}
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Mis Órdenes</CardTitle>
            <div className="flex gap-4">
              <Input
                placeholder="Buscar por ID de Orden"
                value={search}
                onChange={(e: any) => setSearch(e.target.value)}
                className="w-64"
              />
            </div>
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
                    <TableCell className="font-medium">{orden.codigoOc}</TableCell>
                    <TableCell>{formatDate(orden.createdAt)}</TableCell>
                    <TableCell>{orden.cliente?.nombreLegal}</TableCell>
                    <TableCell>
                      <Badge variant="estado" estado={orden.estado} />
                    </TableCell>
                    <TableCell>{formatCurrency(orden.total)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => setSelectedOcId(orden.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
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
