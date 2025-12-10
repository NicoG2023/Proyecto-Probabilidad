// src/router/HomeLanding.tsx
import { Navigate } from "react-router-dom";
import {keycloak} from "../../auth/keycloak";
import EstudianteDashboard from "../../pages/Estudiante/EstudianteDashboard";

export default function HomeLanding() {
  // Si no está autenticado, podrías:
  // - Mostrar EstudianteDashboard "público"
  // - O forzar login (depende de cómo quieras tu UX)
  if (!keycloak.authenticated) {
    // O simplemente return <EstudianteDashboard />;
    return <EstudianteDashboard />;
  }

  const hasRole = (role: string) =>
    keycloak.hasRealmRole && keycloak.hasRealmRole(role);

  if (hasRole("profesor")) {
    return <Navigate to="/profesor" replace />;
  }

  if (hasRole("admin")) {
    return <Navigate to="/admin" replace />;
  }

  // Por defecto, asumimos estudiante
  // (o podrías verificar hasRole("estudiante") explícitamente)
  return <EstudianteDashboard />;
}
