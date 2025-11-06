import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authApi.login(email, password);
      const { user, token } = response.data.data;
      setAuth(user, token);
      navigate(user.role === 'admin' ? '/dashboard' : '/cliente');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center mb-8">
          <Package className="h-12 w-12 text-primary mr-3" />
          <h1 className="text-3xl font-bold text-gray-900">OrderFlow</h1>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Bienvenido de nuevo</CardTitle>
            <CardDescription className="text-center">
              Accede a tu cuenta para gestionar tus órdenes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Correo Electrónico
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tucorreo@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Contraseña
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Introduce tu contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-600">
              <p>¿No tienes una cuenta?{' '}
                <a href="/registro" className="text-primary hover:underline">
                  Regístrate
                </a>
              </p>
              <a href="/recuperar" className="text-primary hover:underline mt-2 block">
                ¿Olvidaste tu contraseña?
              </a>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Credenciales de prueba:</p>
          <p>Admin: admin@ocmanager.com / admin123</p>
          <p>Cliente: cliente@acme.com / cliente123</p>
        </div>
      </div>
    </div>
  );
}
