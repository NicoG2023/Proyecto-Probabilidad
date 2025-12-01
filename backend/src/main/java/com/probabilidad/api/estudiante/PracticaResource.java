package com.probabilidad.api.estudiante;

import java.util.Map;

import com.probabilidad.dto.PracticeQuestionDto;
import com.probabilidad.dto.PracticeCheckResultDto;
import com.probabilidad.servicios.Estudiante.PracticaService;

import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

@Path("/api/practice")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class PracticaResource {

    @Inject
    PracticaService practicaService;

    // ===== DTOs de request (solo para este recurso) =====

    public static class PracticeRenderRequest {
        public Long templateId;
        public Map<String,Object> params;
    }

    public static class PracticeCheckRequest {
        public Long templateId;
        public Map<String,Object> params;
        // AHORA el front envía 'expression' (latex / texto), no 'studentAnswer'
        public String expression;
    }

    // ===== Endpoints =====

    /**
     * Genera el enunciado de práctica y la metadata de la respuesta esperada
     * a partir de un template y un conjunto de parámetros (que pueden venir
     * del frontend como sliders / selects).
     */
    @POST
    @Path("/render")
    @Transactional
    public PracticeQuestionDto render(PracticeRenderRequest req) {
        if (req == null || req.templateId == null) {
            throw new IllegalArgumentException("templateId es obligatorio");
        }
        return practicaService.buildQuestion(req.templateId, req.params);
    }

    /**
     * Verifica la respuesta del estudiante para una pregunta de práctica.
     * Recalcula internamente el valor correcto usando exactamente los mismos
     * parámetros enviados en el body.
     */
    @POST
    @Path("/check")
    @Transactional
    public PracticeCheckResultDto check(PracticeCheckRequest req) {
        if (req == null || req.templateId == null) {
            throw new IllegalArgumentException("templateId es obligatorio");
        }
        // Pasamos la expresión tal cual al servicio
        return practicaService.checkAnswer(req.templateId, req.params, req.expression);
    }
}
