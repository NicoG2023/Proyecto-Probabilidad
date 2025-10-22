package com.probabilidad.api.estudiante;

import com.probabilidad.entidades.IntentoQuiz;
import com.probabilidad.servicios.Estudiante.AuthAlumnoService;
import com.probabilidad.servicios.Estudiante.EstadisticasService;
import com.probabilidad.servicios.Estudiante.IntentoService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;

import java.util.List;
import java.util.Map;

@Path("/api/yo")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class MiPerfilResource {

    @Inject AuthAlumnoService auth;
    @Inject IntentoService intentoService;
    @Inject EstadisticasService estadisticasService;

    /** Rol: ESTUDIANTE — historial de intentos propios. */
    @GET
    @Path("/intentos")
    @RolesAllowed("estudiante")
    public List<IntentoQuiz> misIntentos(
            @QueryParam("pagina") @DefaultValue("0") int pagina,
            @QueryParam("tamano") @DefaultValue("20") int tamano) {
        Long alumnoId = auth.getAlumnoIdDesdeToken();
        return intentoService.listarIntentosDelAlumno(alumnoId, pagina, tamano);
    }

    /** Rol: ESTUDIANTE — ver estadísticas propias. */
    @GET
    @Path("/estadisticas")
    @RolesAllowed("estudiante")
    public Map<String, Object> misEstadisticas() {
        Long alumnoId = auth.getAlumnoIdDesdeToken();
        return estadisticasService.resumenDelAlumno(alumnoId);
    }
}
