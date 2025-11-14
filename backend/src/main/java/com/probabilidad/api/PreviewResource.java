package com.probabilidad.api;

import com.probabilidad.dto.PreviewQuizDto;
import com.probabilidad.servicios.QuizPreviewService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;

// Si usas seguridad a nivel de recurso, puedes poner @RolesAllowed("profesor") aquí.
@Path("/api/preview")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class PreviewResource {

    @Inject
    QuizPreviewService quizPreviewService;

    @GET
    @Path("/intentos/{intentoId}")
    public PreviewQuizDto getPreview(@PathParam("intentoId") Long intentoId) {
        return quizPreviewService.buildPreview(intentoId);
    }
}
