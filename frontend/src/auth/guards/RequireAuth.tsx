import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStrict } from '../AuthContext';

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { ready, authenticated, login } = useAuthStrict();
  const loc = useLocation();

  // Mientras inicializa Keycloak/estado, no navegues
  if (!ready) {
    return <div style={{ padding: 16 }}>Loading…</div>;
  }

  if (!authenticated) {
    login();
    return null;
  }

  return <>{children}</>;
}
