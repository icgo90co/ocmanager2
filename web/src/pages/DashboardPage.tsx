import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { ocApi, ovApi, enviosApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, ShoppingCart, Truck, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);

  const { data: ordenesCompra } = useQuery({
    queryKey: ['ordenes-compra'],
    queryFn: async () => {
      const res = await ocApi.getAll();
      return res.data.data;
    },
  });

  const { data: ordenesVenta } = useQuery({
    queryKey: ['ordenes-venta'],
    queryFn: async () => {
      const res = await ovApi.getAll();
      return res.data.data;
    },
  });

  const { data: envios } = useQuery({
    queryKey: ['envios'],
    queryFn: async () => {
      const res = await enviosApi.getAll();
      return res.data.data;
    },
  });

  const ocPendientes = ordenesCompra?.filter((oc: any) => 
    ['recibida', 'en_proceso'].includes(oc.estado)
  ).length || 0;

  const enviosActivos = envios?.filter((e: any) => 
    ['preparando', 'en_transito'].includes(e.estadoEnvio)
  ).length || 0;

  const totalVentasMes = ordenesVenta?.reduce((acc: number, ov: any) => 
    acc + parseFloat(ov.total), 0
  ) || 0;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {user?.role === 'admin' ? 'Dashboard de Administrador' : `Bienvenido, ${user?.nombre}`}
        </h1>
        <p className="text-gray-600 mt-2">
          {user?.role === 'admin' 
            ? '¡Bienvenido de nuevo, Acá hay un resumen de la actividad.'
            : 'Gestiona y haz seguimiento de todas tus órdenes de compra en un solo lugar.'}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Órdenes de Compra Pendientes
            </CardTitle>
            <FileText className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{ocPendientes}</div>
            <p className="text-xs text-green-600 mt-2">
              +6.2% vs mes anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Ventas (Este Mes)
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {formatCurrency(totalVentasMes)}
            </div>
            <p className="text-xs text-green-600 mt-2">
              +12.8% vs mes anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Envíos Activos
            </CardTitle>
            <Truck className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{enviosActivos}</div>
            <p className="text-xs text-red-600 mt-2">
              -1.5% vs mes anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total de Clientes
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {user?.role === 'admin' ? '1,200' : '1'}
            </div>
            <p className="text-xs text-green-600 mt-2">
              +10 nuevos este mes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Órdenes recientes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Órdenes de Compra Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {ordenesCompra?.slice(0, 5).map((oc: any) => (
                <div key={oc.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium text-gray-900">{oc.codigoOc}</p>
                    <p className="text-sm text-gray-500">{oc.cliente?.nombreLegal}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{formatCurrency(oc.total)}</p>
                    <Badge variant="estado" estado={oc.estado} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Envíos con Atención Requerida</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {envios?.filter((e: any) => ['retenido', 'en_transito'].includes(e.estadoEnvio))
                .slice(0, 5).map((envio: any) => (
                <div key={envio.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium text-gray-900">{envio.numeroEnvio}</p>
                    <p className="text-sm text-gray-500">
                      {envio.ordenVenta?.cliente?.nombreLegal}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant="estado" estado={envio.estadoEnvio} />
                    <p className="text-xs text-gray-500 mt-1">
                      {envio.eventos?.[0]?.ubicacion || 'En tránsito'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
