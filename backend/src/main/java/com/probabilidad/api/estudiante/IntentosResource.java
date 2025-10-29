// src/main/java/com/probabilidad/api/estudiante/IntentosResource.java
package com.probabilidad.api.estudiante;

import com.probabilidad.entidades.InstanciaPregunta;
import com.probabilidad.entidades.IntentoQuiz;
import com.probabilidad.entidades.Quiz;
import com.probabilidad.entidades.Respuesta;
import com.probabilidad.entidades.dominio.TipoCorte;
import com.probabilidad.servicios.Estudiante.*;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.*;
import java.util.stream.Collectors;
import io.quarkus.logging.Log;

@Path("/api")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class IntentosResource {

    @Inject AuthAlumnoService auth;
    @Inject QuizService quizService;
    @Inject IntentoService intentoService;
    @Inject RespuestaService respuestaService;

    // --- Crear intento ---
    /** Rol: ESTUDIANTE — crear un intento indicando corte. */
    @POST
    @Path("/quices/{corte}/intentos")
    @RolesAllowed("estudiante")
    @Transactional
    public IntentoCreadoDTO crearIntento(@PathParam("corte") String corte) {
        Log.info("sisirvohijuePUTA");
        Log.infof("Intento de crear intento para corte", corte);
        Long alumnoId = auth.getAlumnoIdDesdeToken();

        Quiz quizElegido;
        String corteUpper = corte.toUpperCase();
        if ("C3".equals(corteUpper)) {
            quizElegido = quizService.elegirC3Aleatorio();
            Log.infof("quizElegido=%s", quizElegido == null ? "null" : quizElegido.id);
            if (quizElegido == null) throw new NotFoundException("No hay quices activos para C3");
        } else {
            TipoCorte tipo = TipoCorte.valueOf(corteUpper);
            quizElegido = quizService.obtenerActivoPorCorte(tipo);
            Log.infof("quizElegido=%s", quizElegido == null ? "null" : quizElegido.id);
            if (quizElegido == null) throw new NotFoundException("No hay quiz activo para el corte " + tipo);
        }

        IntentoQuiz intento = intentoService.crearIntento(alumnoId, quizElegido);
        return IntentoCreadoDTO.desde(intento);
    }

    // --- Ver intento con preguntas ---
    /** Rol: ESTUDIANTE — ver preguntas del intento (sin respuestas correctas). */
    @GET
    @Path("/intentos/{id}")
    @RolesAllowed("estudiante")
    public IntentoVistaDTO verIntento(@PathParam("id") Long intentoId) {
        Long alumnoId = auth.getAlumnoIdDesdeToken();
        IntentoQuiz intento = intentoService.obtenerIntentoPropio(intentoId, alumnoId);

        List<InstanciaPregunta> instancias =
            InstanciaPregunta.<InstanciaPregunta>find("intento.id = ?1", intento.id).list();

        List<PreguntaDTO> preguntas = instancias.stream()
                .map(PreguntaDTO::desde)
                .collect(Collectors.toList());

        return IntentoVistaDTO.desde(intento, preguntas);
    }

    // --- Guardar respuestas ---
    /** Rol: ESTUDIANTE — guardar respuestas parcial o en lote. */
    @POST
    @Path("/intentos/{id}/respuestas")
    @RolesAllowed("estudiante")
    @Transactional
    public Response guardarRespuestas(
            @PathParam("id") Long intentoId,
            LoteRespuestasDTO body) {

        Long alumnoId = auth.getAlumnoIdDesdeToken();
        IntentoQuiz intento = intentoService.obtenerIntentoPropio(intentoId, alumnoId);

        Map<Long, String> mapa = body.respuestas.stream()
                .collect(Collectors.toMap(r -> r.instanciaId, r -> r.opcionMarcada));

        respuestaService.guardarRespuestasEnLote(intento, mapa);
        return Response.noContent().build();
    }

    // --- Enviar intento ---
    /** Rol: ESTUDIANTE — finalizar intento, calificar y devolver resumen. */
    @POST
    @Path("/intentos/{id}/enviar")
    @RolesAllowed("estudiante")
    @Transactional
    public ResultadoEnvioDTO enviarIntento(@PathParam("id") Long intentoId) {
        Long alumnoId = auth.getAlumnoIdDesdeToken();
        IntentoQuiz intento = intentoService.enviarIntento(intentoId, alumnoId);

        long total = InstanciaPregunta.count("intento.id = ?1", intento.id);
        long correctas = Respuesta.count("instanciaPregunta.intento.id = ?1 and isCorrect = true", intento.id);

        return ResultadoEnvioDTO.desde(intento, total, correctas);
    }

    // --- Ver retroalimentación ---
    /** Rol: ESTUDIANTE — ver cuáles respuestas fueron correctas y cuáles no. */
    @GET
    @Path("/intentos/{id}/retroalimentacion")
    @RolesAllowed("estudiante")
    public List<RetroalimentacionDTO> verRetroalimentacion(@PathParam("id") Long intentoId) {
        Long alumnoId = auth.getAlumnoIdDesdeToken();
        IntentoQuiz intento = intentoService.obtenerIntentoPropio(intentoId, alumnoId);

        List<InstanciaPregunta> instancias =
            InstanciaPregunta.<InstanciaPregunta>find("intento.id = ?1", intento.id).list();

        Map<Long, Respuesta> respuestas = Respuesta.<Respuesta>list(
                "instanciaPregunta.intento.id = ?1", intento.id).stream()
                .collect(Collectors.toMap(r -> r.instanciaPregunta.id, r -> r));

        return instancias.stream().map(ip -> {
            Respuesta r = respuestas.get(ip.id);
            return RetroalimentacionDTO.desde(ip, r);
        }).toList();
    }

    // ============== DTOs (nombres en español) ==============

    public static class IntentoCreadoDTO {
        public Long intentoId;
        public Long quizId;
        public String corte;
        public String iniciadoEn;
        public static IntentoCreadoDTO desde(IntentoQuiz i) {
            IntentoCreadoDTO d = new IntentoCreadoDTO();
            d.intentoId = i.id;
            d.quizId = i.quiz.id;
            d.corte = i.quiz.corte.name();
            d.iniciadoEn = i.startedAt.toString();
            return d;
        }
    }

    public static class IntentoVistaDTO {
        public Long intentoId;
        public Long quizId;
        public String estado;
        public List<PreguntaDTO> preguntas;
        public static IntentoVistaDTO desde(IntentoQuiz i, List<PreguntaDTO> qs) {
            IntentoVistaDTO d = new IntentoVistaDTO();
            d.intentoId = i.id;
            d.quizId = i.quiz.id;
            d.estado = i.status.name();
            d.preguntas = qs;
            return d;
        }
    }

    public static class PreguntaDTO {
        public Long instanciaId;
        public String enunciado;
        public Map<String, String> opciones;
        public static PreguntaDTO desde(InstanciaPregunta ip) {
            PreguntaDTO d = new PreguntaDTO();
            d.instanciaId = ip.id;
            d.enunciado = ip.stemMd;
            d.opciones = ip.opciones;
            return d;
        }
    }

    public static class LoteRespuestasDTO {
        public List<ItemRespuestaDTO> respuestas;
    }

    public static class ItemRespuestaDTO {
        public Long instanciaId;
        public String opcionMarcada;
    }

    public static class ResultadoEnvioDTO {
        public Long intentoId;
        public String estado;
        public Double nota;
        public Long totalPreguntas;
        public Long correctas;
        public static ResultadoEnvioDTO desde(IntentoQuiz i, long total, long corr) {
            ResultadoEnvioDTO d = new ResultadoEnvioDTO();
            d.intentoId = i.id;
            d.estado = i.status.name();
            d.nota = i.score != null ? i.score.doubleValue() : null;
            d.totalPreguntas = total;
            d.correctas = corr;
            return d;
        }
    }

    public static class RetroalimentacionDTO {
        public Long instanciaId;
        public String enunciado;
        public Map<String, String> opciones;
        public String opcionMarcada;
        public boolean esCorrecta;
        public String opcionCorrecta;
        public static RetroalimentacionDTO desde(InstanciaPregunta ip, Respuesta r) {
            RetroalimentacionDTO d = new RetroalimentacionDTO();
            d.instanciaId = ip.id;
            d.enunciado = ip.stemMd;
            d.opciones = ip.opciones;
            d.opcionMarcada = r != null ? r.chosenKey : null;
            d.esCorrecta = r != null && r.isCorrect;
            d.opcionCorrecta = ip.llaveCorrecta;
            return d;
        }
    }
}
