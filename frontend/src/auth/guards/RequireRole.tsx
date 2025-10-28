import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStrict } from '../AuthContext';

export default function RequireRole({ role, children }:{ role:string; children:React.ReactNode }) {
  const { ready, authenticated, hasRealmRole } = useAuthStrict();
  const loc = useLocation();
  if (!ready) return null;
  if (!authenticated) return <Navigate to="/" state={{ from: loc }} replace />;
  if (!hasRealmRole(role)) return <Navigate to="/" state={{ from: loc }} replace />;
  return <>{children}</>;
}
