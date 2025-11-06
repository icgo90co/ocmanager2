import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { clientesApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit } from 'lucide-react';
import { ClienteForm } from '@/components/ClienteForm';

export default function ClientesPage() {
  const [search, setSearch] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCliente, setEditingCliente] = useState<any>(null);

  const { data: clientes, isLoading } = useQuery({
    queryKey: ['clientes', search],
    queryFn: async () => {
      const res = await clientesApi.getAll();
      return res.data.data;
    },
  });

  const filteredClientes = clientes?.filter((c: any) => 
    search === '' || 
    c.nombreLegal.toLowerCase().includes(search.toLowerCase()) ||
    c.nit.includes(search)
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Clientes</h1>
          <p className="text-gray-600 mt-2">
            Administra la información de tus clientes.
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Cliente
        </Button>
      </div>

      <ClienteForm 
        open={showCreateForm} 
        onOpenChange={setShowCreateForm}
      />
      
      <ClienteForm 
        open={!!editingCliente} 
        onOpenChange={(open) => !open && setEditingCliente(null)}
        cliente={editingCliente}
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Lista de Clientes</CardTitle>
            <Input
              placeholder="Buscar por nombre o NIT"
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
                  <TableHead>Nombre Legal</TableHead>
                  <TableHead>NIT</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Ciudad</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClientes?.map((cliente: any) => (
                  <TableRow key={cliente.id}>
                    <TableCell className="font-medium">{cliente.nombreLegal}</TableCell>
                    <TableCell>{cliente.nit}</TableCell>
                    <TableCell>{cliente.email}</TableCell>
                    <TableCell>{cliente.telefono || '-'}</TableCell>
                    <TableCell>{cliente.ciudad || '-'}</TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => setEditingCliente(cliente)}
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
