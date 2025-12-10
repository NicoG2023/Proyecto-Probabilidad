import { useAuthStrict } from '../AuthContext';

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { ready, authenticated, login } = useAuthStrict();

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
