// src/app/AppLayout.tsx
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useMemo } from 'react';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';
import { useAuthStrict } from '../auth/AuthContext';

export default function AppLayout() {
  const { authenticated, hasRealmRole } = useAuthStrict();
  const navigate = useNavigate();
  const location = useLocation();

  const isAdmin = useMemo(
    () => authenticated && hasRealmRole('admin'),
    [authenticated, hasRealmRole]
  );

  useEffect(() => {
    if (!authenticated || !isAdmin) return;
    const noRedirect = ['/admin', '/users-management'];
    if (!noRedirect.includes(location.pathname)) {
      const from = (location.state as any)?.from?.pathname;
      if (!from) navigate('/admin', { replace: true });
    }
  }, [authenticated, isAdmin, location.pathname, location.state, navigate]);

  return (
    <div className="min-h-screen bg-white text-black flex flex-col">
      {/* Navbar */}
      <NavBar />

      {/* Contenido */}
      <main className="flex-1 mx-auto max-w-7xl px-6 py-6">
        <Outlet />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
