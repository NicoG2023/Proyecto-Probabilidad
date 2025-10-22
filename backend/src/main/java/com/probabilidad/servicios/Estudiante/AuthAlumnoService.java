package com.probabilidad.servicios.Estudiante;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import io.quarkus.security.identity.SecurityIdentity;

/**
 * Servicio auxiliar – flujo de ESTUDIANTE.
 * Resuelve el "id" del alumno desde el token.
 * En el dummy: espera un claim "student_id" (numérico) o usa "sub" si es numérico.
 */
@ApplicationScoped
public class AuthAlumnoService {

    @Inject
    SecurityIdentity identity;

    public Long getAlumnoIdDesdeToken() {
        Object claim = identity.getAttribute("student_id");
        if (claim instanceof Number n) {
            return n.longValue();
        }
        // Fallback: si el sub es numérico (dummy)
        String sub = identity.getAttribute("sub");
        if (sub != null && sub.matches("\\d+")) {
            return Long.parseLong(sub);
        }
        throw new IllegalStateException("No se pudo resolver student_id desde el token");
    }
}
