import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ovApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Plus, Eye, FileDown, FileText } from 'lucide-react';
import { OrdenVentaForm } from '@/components/OrdenVentaForm';
import { OVDetailDialog } from '@/components/OVDetailDialog';

export default function OrdenesVentaPage() {
  const user = useAuthStore((state) => state.user);
  const [search, setSearch] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedOvId, setSelectedOvId] = useState<number | null>(null);

  const { data: ordenes, isLoading } = useQuery({
    queryKey: ['ordenes-venta', search],
    queryFn: async () => {
      const res = await ovApi.getAll({ codigoOv: search });
      return res.data.data;
    },
  });

  const handleDownloadPDF = async (id: number, codigoOv: string) => {
    try {
      await ovApi.downloadPDF(id, codigoOv);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error al descargar el PDF');
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Órdenes de Venta</h1>
          <p className="text-gray-600 mt-2">
            Crea y gestiona órdenes de venta.
          </p>
        </div>
        {user?.role === 'admin' && (
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva OV
          </Button>
        )}
      </div>

      <OrdenVentaForm open={showCreateForm} onOpenChange={setShowCreateForm} />
      <OVDetailDialog 
        open={!!selectedOvId} 
        onOpenChange={(open) => !open && setSelectedOvId(null)} 
        ovId={selectedOvId || 0} 
      />

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
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {orden.cliente?.nombreLegal}
                        {orden.notas && (
                          <span title={`Tiene notas: ${orden.notas.substring(0, 50)}${orden.notas.length > 50 ? '...' : ''}`}>
                            <FileText className="h-4 w-4 text-blue-500" />
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="estado" estado={orden.estado} />
                    </TableCell>
                    <TableCell>{formatCurrency(orden.total)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => setSelectedOvId(orden.id)}
                          title="Ver detalles"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDownloadPDF(orden.id, orden.codigoOv)}
                          title="Descargar PDF"
                        >
                          <FileDown className="h-4 w-4" />
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
