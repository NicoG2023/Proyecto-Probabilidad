package com.probabilidad.servicios;

import com.probabilidad.dto.PreviewQuizDto;
import com.probabilidad.dto.PreviewPreguntaDto;
import com.probabilidad.entidades.Alumno;
import com.probabilidad.entidades.IntentoQuiz;
import com.probabilidad.entidades.InstanciaPregunta;
import com.probabilidad.entidades.InstanciaPregunta.TipoInstancia;
import com.probabilidad.entidades.Respuesta;
import com.probabilidad.entidades.dominio.EstadoIntento;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@ApplicationScoped
public class QuizPreviewService {

    @Inject
    EntityManager em;

    public PreviewQuizDto buildPreview(Long intentoId) {

        // ===== Intento =====
        IntentoQuiz intento = em.find(IntentoQuiz.class, intentoId);
        if (intento == null) {
            throw new IllegalArgumentException("Intento no encontrado");
        }

        if (intento.status != EstadoIntento.PRESENTADO) {
            throw new IllegalStateException("El intento no está presentado");
        }

        PreviewQuizDto dto = new PreviewQuizDto();
        dto.intentoId = intento.id;

        if (intento.quiz != null) {
            dto.quizId = intento.quiz.id;
            dto.quizTitulo = intento.quiz.titulo;
        }

        // ===== Alumno =====
        Alumno alumno = em.find(Alumno.class, intento.studentId);
        if (alumno != null) {
            dto.estudianteUsername = alumno.username;
            dto.estudianteEmail = alumno.email;
        }

        dto.estado = intento.status.name();
        dto.nota = intento.score;   // BigDecimal en el DTO

        // ===== Preguntas del intento =====
        List<InstanciaPregunta> instancias = em.createQuery(
                "SELECT ip FROM InstanciaPregunta ip " +
                "WHERE ip.intento.id = :intentoId " +
                "ORDER BY ip.id",
                InstanciaPregunta.class)
            .setParameter("intentoId", intentoId)
            .getResultList();

        dto.preguntas = instancias.stream()
                .map(this::buildPreguntaPreview)
                .collect(Collectors.toList());

        return dto;
    }

    private PreviewPreguntaDto buildPreguntaPreview(InstanciaPregunta inst) {
        PreviewPreguntaDto p = new PreviewPreguntaDto();

        p.instanciaId = inst.id;
        p.enunciado = inst.stemMd;
        p.tipo = inst.tipo.name();
        p.opciones = inst.opciones;      // puede ser {} para abiertas

        // ===== Respuesta del alumno a esta instancia =====
        Respuesta r = findRespuestaByInstancia(inst.id);

        // bandera de corrección (si hay respuesta)
        p.esCorrecta = (r != null && Boolean.TRUE.equals(r.isCorrect));

        // según el tipo llenamos los campos
        if (inst.tipo == TipoInstancia.MCQ) {
            p.opcionMarcada = (r != null ? r.chosenKey : null);
            p.opcionCorrecta = inst.llaveCorrecta;

        } else if (inst.tipo == TipoInstancia.OPEN_TEXT) {
            p.valorIngresado = (r != null ? r.chosenValue : null);
            p.valorEsperado = extractExpectedText(inst.correctValue);

        } else if (inst.tipo == TipoInstancia.OPEN_NUM) {
            // chosenNumber seguramente es BigDecimal en la entidad Respuesta
            BigDecimal chosen = (r != null ? r.chosenNumber : null);
            BigDecimal esperado = extractExpectedNumber(inst.correctValue);

            p.numeroIngresado = (chosen != null ? chosen.doubleValue() : null);
            p.numeroEsperado = (esperado != null ? esperado.doubleValue() : null);
        }

        return p;
    }

    private Respuesta findRespuestaByInstancia(Long instanciaId) {
        TypedQuery<Respuesta> q = em.createQuery(
                "SELECT r FROM Respuesta r " +
                "WHERE r.instanciaPregunta.id = :instId",
                Respuesta.class);
        q.setParameter("instId", instanciaId);
        q.setMaxResults(1);
        List<Respuesta> list = q.getResultList();
        return list.isEmpty() ? null : list.get(0);
    }

    // ===== Helpers para correctValue JSONB =====

    /**
     * correct_value: {"type":"text","value":"..."} -> devuelve el value como String
     */
    private String extractExpectedText(Map<String, Object> correctValue) {
        if (correctValue == null) return null;
        Object v = correctValue.get("value");
        return v != null ? String.valueOf(v) : null;
    }

    /**
     * correct_value: {"type":"number","value":0.1234} -> devuelve BigDecimal
     */
    private BigDecimal extractExpectedNumber(Map<String, Object> correctValue) {
        if (correctValue == null) return null;
        Object v = correctValue.get("value");
        if (v == null) return null;

        if (v instanceof BigDecimal bd) return bd;
        if (v instanceof Number n) return BigDecimal.valueOf(n.doubleValue());
        try {
            return new BigDecimal(v.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
