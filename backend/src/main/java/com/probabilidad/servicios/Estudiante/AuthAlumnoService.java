package com.probabilidad.servicios.Estudiante;

import com.probabilidad.entidades.Alumno;
import io.quarkus.narayana.jta.QuarkusTransaction;
import io.quarkus.hibernate.orm.panache.Panache;
import io.quarkus.security.identity.SecurityIdentity;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class AuthAlumnoService {

    @Inject SecurityIdentity identity;

    public Long getAlumnoIdDesdeToken() {
        // ---- Claims del token ----
        final String sub = attr("sub") != null && !attr("sub").isBlank()
                ? attr("sub")
                : (identity.getPrincipal() != null ? identity.getPrincipal().getName() : null);
        if (sub == null || sub.isBlank()) {
            throw new IllegalStateException("Token sin 'sub' válido");
        }
        final String username = firstNonBlank(attr("preferred_username"), attr("username"));
        final String email = attr("email");

        // 1) Lectura rápida fuera de transacción nueva
        Alumno a = Alumno.find("keycloakSub", sub).firstResult();
        if (a != null) return a.id;

        // 2) Crear si no existe, en TX nueva y sin excepciones de única
        Long id = QuarkusTransaction.requiringNew().call(() -> {
            // doble verificación dentro de la TX
            Alumno again = Alumno.find("keycloakSub", sub).firstResult();
            if (again != null) return again.id;

            // INSERT idempotente (Postgres)
            Panache.getEntityManager()
                .createNativeQuery(
                    "INSERT INTO alumnos (keycloak_sub, username, email, created_at, updated_at) " +
                    "VALUES (?1, ?2, ?3, now(), now()) " +
                    "ON CONFLICT (keycloak_sub) DO NOTHING")
                .setParameter(1, sub)
                .setParameter(2, username)
                .setParameter(3, email)
                .executeUpdate();

            Alumno created = Alumno.find("keycloakSub", sub).firstResult();
            return created != null ? created.id : null;
        });

        if (id != null) return id;

        // 3) Relectura final por si otro hilo ganó la carrera
        a = Alumno.find("keycloakSub", sub).firstResult();
        if (a != null) return a.id;

        throw new IllegalStateException("No se pudo crear/leer Alumno para sub=" + sub);
    }

    // ---- helpers ----
    private String attr(String name) {
        Object v = identity.getAttribute(name);
        return v != null ? String.valueOf(v) : null;
    }
    private String firstNonBlank(String a, String b) {
        if (a != null && !a.isBlank()) return a;
        if (b != null && !b.isBlank()) return b;
        return null;
    }
}
