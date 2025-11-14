package com.probabilidad.servicios.Estudiante;

import com.probabilidad.entidades.Alumno;
import io.quarkus.hibernate.orm.panache.Panache;
import io.quarkus.narayana.jta.QuarkusTransaction;
import io.quarkus.security.identity.SecurityIdentity;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.jwt.JsonWebToken;

@ApplicationScoped
public class AuthAlumnoService {

    @Inject
    SecurityIdentity identity;

    @Inject
    JsonWebToken jwt;

    public Long getAlumnoIdDesdeToken() {
        // ---- Claims del token ----
        final String sub = firstNonBlank(
                claim("sub"),
                jwt != null ? jwt.getSubject() : null,
                principalName()
        );

        if (sub == null || sub.isBlank()) {
            throw new IllegalStateException("Token sin 'sub' válido");
        }

        final String username = firstNonBlank(
                claim("preferred_username"),
                claim("username")
        );
        final String email = claim("email");

        // 1) Lectura rápida fuera de TX nueva
        Alumno a = Alumno.find("keycloakSub", sub).firstResult();
        if (a != null) return a.id;

        // 2) Crear / actualizar si no existe, en TX nueva
        Long id = QuarkusTransaction.requiringNew().call(() -> {
            Alumno again = Alumno.find("keycloakSub", sub).firstResult();
            if (again != null) return again.id;

            Panache.getEntityManager()
                    .createNativeQuery(
                            "INSERT INTO alumnos (keycloak_sub, username, email, created_at, updated_at) " +
                            "VALUES (?1, ?2, ?3, now(), now()) " +
                            "ON CONFLICT (keycloak_sub) DO UPDATE " +
                            "  SET username = EXCLUDED.username, " +
                            "      email    = EXCLUDED.email, " +
                            "      updated_at = now()"
                    )
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

    /** Lee un claim del JWT si existe, como String */
    private String claim(String name) {
        if (jwt == null) return null;
        Object v = jwt.getClaim(name);
        return v != null ? String.valueOf(v) : null;
    }

    /** Nombre del principal como último fallback */
    private String principalName() {
        return identity.getPrincipal() != null
                ? identity.getPrincipal().getName()
                : null;
    }

    /** Devuelve el primer String no vacío de la lista, o null si todos son nulos/blancos */
    private String firstNonBlank(String... values) {
        if (values == null) return null;
        for (String v : values) {
            if (v != null && !v.isBlank()) return v;
        }
        return null;
    }
}
