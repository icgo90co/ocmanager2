import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/lib/api';
import {
  Package,
  ShoppingCart,
  Truck,
  FileText,
  Users,
  Box,
  LogOut,
  LayoutDashboard,
  UserCog,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DashboardLayout() {
  const navigate = useNavigate();
  const { user, clearAuth } = useAuthStore();

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    } finally {
      clearAuth();
      navigate('/login');
    }
  };

  const adminMenuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: FileText, label: 'Órdenes de Compra', path: '/ordenes-compra' },
    { icon: ShoppingCart, label: 'Órdenes de Venta', path: '/ordenes-venta' },
    { icon: Truck, label: 'Envíos', path: '/envios' },
    { icon: Box, label: 'Productos', path: '/productos' },
    { icon: Users, label: 'Clientes', path: '/clientes' },
    { icon: UserCog, label: 'Usuarios', path: '/usuarios' },
  ];

  const clienteMenuItems = [
    { icon: LayoutDashboard, label: 'Mi Panel', path: '/cliente' },
    { icon: FileText, label: 'Mis Órdenes de Compra', path: '/ordenes-compra' },
    { icon: ShoppingCart, label: 'Mis Órdenes de Venta', path: '/ordenes-venta' },
    { icon: Truck, label: 'Mis Envíos', path: '/envios' },
  ];

  const menuItems = user?.role === 'admin' ? adminMenuItems : clienteMenuItems;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Package className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">OrderFlow</h1>
              <p className="text-xs text-gray-500">
                {user?.role === 'admin' ? 'Panel Admin' : 'Gestión Logística'}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-primary rounded-lg transition-colors"
            >
              <item.icon className="h-5 w-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-semibold">
                {user?.nombre?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.nombre}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Cerrar Sesión
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
