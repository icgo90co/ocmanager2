import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { productosApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';
import { Plus, Edit } from 'lucide-react';
import { ProductoForm } from '@/components/ProductoForm';

export default function ProductosPage() {
  const [search, setSearch] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingProducto, setEditingProducto] = useState<any>(null);

  const { data: productos, isLoading } = useQuery({
    queryKey: ['productos', search],
    queryFn: async () => {
      const res = await productosApi.getAll({ sku: search });
      return res.data.data;
    },
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Productos</h1>
          <p className="text-gray-600 mt-2">
            Crea y gestiona el catálogo de productos.
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Producto
        </Button>
      </div>

      <ProductoForm 
        open={showCreateForm} 
        onOpenChange={setShowCreateForm}
      />
      
      <ProductoForm 
        open={!!editingProducto} 
        onOpenChange={(open) => !open && setEditingProducto(null)}
        producto={editingProducto}
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Catálogo</CardTitle>
            <Input
              placeholder="Buscar por SKU"
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
                  <TableHead>SKU</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Unidad</TableHead>
                  <TableHead>Precio Base</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productos?.map((producto: any) => (
                  <TableRow key={producto.id}>
                    <TableCell className="font-medium">{producto.sku}</TableCell>
                    <TableCell>{producto.nombre}</TableCell>
                    <TableCell className="max-w-xs truncate">{producto.descripcion}</TableCell>
                    <TableCell>{producto.unidad}</TableCell>
                    <TableCell>{formatCurrency(producto.precioBase)}</TableCell>
                    <TableCell>
                      <Badge variant={producto.activo ? 'default' : 'secondary'}>
                        {producto.activo ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => setEditingProducto(producto)}
                      >
                        <Edit className="h-4 w-4" />
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
