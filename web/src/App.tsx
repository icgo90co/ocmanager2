import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './components/layouts/DashboardLayout';
import DashboardPage from './pages/DashboardPage';
import OrdenesCompraPage from './pages/OrdenesCompraPage';
import OrdenesVentaPage from './pages/OrdenesVentaPage';
import EnviosPage from './pages/EnviosPage';
import ProductosPage from './pages/ProductosPage';
import ClientesPage from './pages/ClientesPage';
import UsersPage from './pages/UsersPage';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function App() {
  const user = useAuthStore((state) => state.user);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      
      <Route
        path="/"
        element={
          <PrivateRoute>
            <DashboardLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to={user?.role === 'admin' ? '/dashboard' : '/cliente'} />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="cliente" element={<DashboardPage />} />
        <Route path="ordenes-compra" element={<OrdenesCompraPage />} />
        <Route path="ordenes-venta" element={<OrdenesVentaPage />} />
        <Route path="envios" element={<EnviosPage />} />
        <Route path="productos" element={<ProductosPage />} />
        <Route path="clientes" element={<ClientesPage />} />
        <Route path="usuarios" element={<UsersPage />} />
      </Route>
    </Routes>
  );
}

export default App;
