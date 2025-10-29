package com.probabilidad.api.estudiante;

import com.probabilidad.entidades.Quiz;
import com.probabilidad.entidades.dominio.TipoCorte;
import com.probabilidad.servicios.Estudiante.QuizService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import java.util.List;

@Path("/api")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class QuicesResource {

    @Inject QuizService quizService;

    /** Rol: ESTUDIANTE — lista los quices activos disponibles. */
    @GET
    @Path("/activos")
    @RolesAllowed("estudiante")
    public List<Quiz> listarActivos() {
        return quizService.listarQuicesActivos();
    }

    /** Rol: ESTUDIANTE — obtener un quiz activo exacto por corte. */
    @GET
    @Path("/activos/{corte}")
    @RolesAllowed("estudiante")
    public Quiz obtenerPorCorte(@PathParam("corte") String corte) {
        TipoCorte tipo = TipoCorte.valueOf(corte.toUpperCase());
        Quiz q = quizService.obtenerActivoPorCorte(tipo);
        if (q == null) {
            throw new NotFoundException("No hay un quiz activo para el corte " + tipo);
        }
        return q;
    }
}
