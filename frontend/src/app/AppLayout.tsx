// src/app/AppLayout.tsx
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useMemo } from 'react';
import NavBar from '../components/NavBar';
import { useAuthStrict } from '../auth/AuthContext';

export default function AppLayout() {
  const { authenticated, hasRealmRole } = useAuthStrict();
  const navigate = useNavigate();
  const location = useLocation();

  // ¿Es admin?
  const isAdmin = useMemo(
    () => authenticated && hasRealmRole('admin'),
    [authenticated, hasRealmRole]
  );

  // Si inicia sesión y es admin, redirigir a /admin (si no viene de allí)
  useEffect(() => {
    if (!authenticated || !isAdmin) return;
    const noRedirect = ['/admin', '/users-management'];
    if (!noRedirect.includes(location.pathname)) {
      const from = (location.state as any)?.from?.pathname;
      if (!from) navigate('/admin', { replace: true });
    }
  }, [authenticated, isAdmin, location.pathname, location.state, navigate]);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Navbar visible siempre (autenticado o no) */}
      <NavBar />

      {/* Contenido principal */}
      <main className="mx-auto max-w-7xl px-6 py-6">
        <Outlet />
      </main>
    </div>
  );
}
