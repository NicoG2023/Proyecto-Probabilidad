// src/main/java/com/probabilidad/api/estudiante/IntentosResource.java
package com.probabilidad.api.estudiante;

import com.probabilidad.entidades.InstanciaPregunta;
import com.probabilidad.entidades.InstanciaPregunta.TipoInstancia;
import com.probabilidad.entidades.IntentoQuiz;
import com.probabilidad.entidades.Quiz;
import com.probabilidad.entidades.Respuesta;
import com.probabilidad.entidades.dominio.TipoCorte;
import com.probabilidad.servicios.Estudiante.AuthAlumnoService;
import com.probabilidad.servicios.Estudiante.IntentoService;
import com.probabilidad.servicios.Estudiante.QuizService;
import com.probabilidad.servicios.Estudiante.RespuestaService;

import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.*;
import java.util.stream.Collectors;

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
        Long alumnoId = auth.getAlumnoIdDesdeToken();

        Quiz quizElegido;
        String corteUpper = corte.toUpperCase(Locale.ROOT);
        if ("C3".equals(corteUpper)) {
            quizElegido = quizService.elegirC3Aleatorio();
            if (quizElegido == null) throw new NotFoundException("No hay quices activos para C3");
        } else {
            TipoCorte tipo = TipoCorte.valueOf(corteUpper);
            quizElegido = quizService.obtenerActivoPorCorte(tipo);
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
    public Response guardarRespuestas(@PathParam("id") Long intentoId, LoteRespuestasDTO body) {
        Long alumnoId = auth.getAlumnoIdDesdeToken();
        IntentoQuiz intento = intentoService.obtenerIntentoPropio(intentoId, alumnoId);

        // Mapear a la clase helper del servicio
        List<RespuestaService.ItemLote> items = (body == null || body.respuestas == null)
                ? List.of()
                : body.respuestas.stream().map(x -> {
                    RespuestaService.ItemLote y = new RespuestaService.ItemLote();
                    y.instanciaId = x.instanciaId;
                    y.opcionMarcada = x.opcionMarcada;
                    y.valorNumero = x.valorNumero;
                    y.valorTexto = x.valorTexto;
                    return y;
                }).toList();

        respuestaService.guardarRespuestasEnLote(intento, items);
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

    // ====================== DTOs ======================

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
        public String tipo; // "MCQ" | "OPEN_NUM" | "OPEN_TEXT"

        public static PreguntaDTO desde(InstanciaPregunta ip) {
            PreguntaDTO d = new PreguntaDTO();
            d.instanciaId = ip.id;
            d.enunciado   = ip.stemMd;
            d.opciones    = ip.opciones != null ? ip.opciones : Map.of();
            d.tipo        = ip.tipo != null ? ip.tipo.name() : TipoInstancia.MCQ.name(); // fallback
            return d;
        }
    }

    public static class LoteRespuestasDTO {
        public List<ItemRespuestaDTO> respuestas;
    }

    public static class ItemRespuestaDTO {
        public Long instanciaId;
        public String opcionMarcada;             // MCQ
        public java.math.BigDecimal valorNumero; // OPEN_NUM
        public String valorTexto;                // OPEN_TEXT
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

        // Tipo y resultado general
        public String tipo;              // "MCQ" | "OPEN_NUM" | "OPEN_TEXT"
        public boolean esCorrecta;

        // MCQ
        public String opcionMarcada;     // "A", "B", ...
        public String opcionCorrecta;    // "A" (null en abiertas)

        // Abiertas
        public String valorIngresado;    // OPEN_TEXT
        public Double numeroIngresado;   // OPEN_NUM
        public String valorEsperado;     // Mostrar al estudiante (numérico formateado o texto)

        public static RetroalimentacionDTO desde(InstanciaPregunta ip, Respuesta r) {
            RetroalimentacionDTO d = new RetroalimentacionDTO();
            d.instanciaId = ip.id;
            d.enunciado   = ip.stemMd;
            d.opciones    = ip.opciones != null ? ip.opciones : Map.of();
            d.tipo        = ip.tipo != null ? ip.tipo.name() : TipoInstancia.MCQ.name();
            d.esCorrecta  = (r != null && Boolean.TRUE.equals(r.isCorrect));

            if (ip.tipo == null || ip.tipo == TipoInstancia.MCQ) {
                d.opcionCorrecta  = ip.llaveCorrecta;
                d.opcionMarcada   = (r != null ? r.chosenKey : null);
                d.valorIngresado  = null;
                d.numeroIngresado = null;
                d.valorEsperado   = null; // MCQ no aplica
                return d;
            }

            switch (ip.tipo) {
                case OPEN_NUM -> {
                    d.opcionCorrecta  = null;
                    d.opcionMarcada   = null;
                    d.numeroIngresado = (r != null && r.chosenNumber != null) ? r.chosenNumber.doubleValue() : null;
                    d.valorIngresado  = null;
                    d.valorEsperado   = formatearEsperadoNumero(ip.correctValue);
                }
                case OPEN_TEXT -> {
                    d.opcionCorrecta  = null;
                    d.opcionMarcada   = null;
                    d.valorIngresado  = (r != null ? r.chosenValue : null);
                    d.numeroIngresado = null;
                    d.valorEsperado   = formatearEsperadoTexto(ip.correctValue);
                }
                default -> {
                    d.opcionCorrecta  = ip.llaveCorrecta;
                    d.opcionMarcada   = (r != null ? r.chosenKey : null);
                    d.valorIngresado  = null;
                    d.numeroIngresado = null;
                    d.valorEsperado   = null;
                }
            }
            return d;
        }

        // ===== Helpers para formatear el esperado de abiertas =====

        @SuppressWarnings("unchecked")
        private static String formatearEsperadoNumero(Map<String,Object> cv) {
            if (cv == null) return null;
            Object type = cv.get("type");
            if (!"number".equals(type)) return null;

            double value = asDouble(cv.get("value"));
            String fmt   = str(cv.get("format"), "number"); // number|integer|percent
            int dec      = asInt(cv.get("decimals"), 4);

            if ("integer".equalsIgnoreCase(fmt)) {
                return String.valueOf(Math.round(value));
            }
            if ("percent".equalsIgnoreCase(fmt)) {
                double pct = value * 100.0;
                return new java.text.DecimalFormat(pattern(dec)).format(pct) + " %";
            }
            // number
            return new java.text.DecimalFormat(pattern(dec)).format(value);
        }

        @SuppressWarnings("unchecked")
        private static String formatearEsperadoTexto(Map<String,Object> cv) {
            if (cv == null) return null;
            Object type = cv.get("type");
            if (!"text".equals(type)) return null;

            // Si definiste "canonical" en correctValue, úsalo
            Object canonical = cv.get("canonical");
            if (canonical != null) return String.valueOf(canonical);

            // Si no, une las alternativas aceptadas para mostrarlas
            Object acc = cv.get("accept");
            if (acc instanceof List<?> lst && !lst.isEmpty()) {
                return lst.stream().filter(Objects::nonNull).map(String::valueOf)
                        .collect(Collectors.joining(" / "));
            }
            return null;
        }

        private static String pattern(int decimals) {
            StringBuilder sb = new StringBuilder("0");
            if (decimals > 0) {
                sb.append(".");
                for (int i = 0; i < decimals; i++) sb.append("0");
            }
            return sb.toString();
        }
        private static double asDouble(Object o) {
            if (o instanceof Number n) return n.doubleValue();
            return Double.parseDouble(String.valueOf(o));
        }
        private static int asInt(Object o, int def) {
            if (o instanceof Number n) return n.intValue();
            try { return Integer.parseInt(String.valueOf(o)); } catch (Exception e) { return def; }
        }
        private static String str(Object o, String def) {
            return o == null ? def : String.valueOf(o);
        }
    }
}
