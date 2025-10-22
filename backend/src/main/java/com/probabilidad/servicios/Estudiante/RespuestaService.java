package com.probabilidad.servicios.Estudiante;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import com.probabilidad.entidades.InstanciaPregunta;
import com.probabilidad.entidades.IntentoQuiz;
import com.probabilidad.entidades.Respuesta;
import com.probabilidad.entidades.dominio.EstadoIntento;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;

/**
 * Flujo de ESTUDIANTE: guardar respuestas mientras el intento está EN_PROGRESO.
 * Calificación (dummy MCQ): chosenKey == llave_correcta.
 */
@ApplicationScoped
public class RespuestaService {

    @Transactional
    public Respuesta guardarRespuestaOpcion(IntentoQuiz intento, Long instanciaId, String chosenKey) {
        if (intento.status != EstadoIntento.EN_PROGRESO)
            throw new IllegalStateException("El intento ya no admite respuestas");

        InstanciaPregunta ip = InstanciaPregunta.findById(instanciaId);
        if (ip == null || !ip.intento.id.equals(intento.id))
            throw new IllegalArgumentException("Instancia inválida para este intento");

        Respuesta r = Respuesta.find("instanciaPregunta.id = ?1", instanciaId).firstResult();
        if (r == null) {
            r = new Respuesta();
            r.instanciaPregunta = ip;
        }
        r.chosenKey = chosenKey;
        r.isCorrect = elegirCorrecta(ip, chosenKey);
        r.persist();
        return r;
    }

    @Transactional
    public void guardarRespuestasEnLote(IntentoQuiz intento, Map<Long, String> respuestas) {
        for (Map.Entry<Long, String> e : respuestas.entrySet()) {
            guardarRespuestaOpcion(intento, e.getKey(), e.getValue());
        }
    }

    /** Califica el intento y actualiza score/scorePoints. */
    @Transactional
    public void calificarIntento(IntentoQuiz intento) {
        List<InstanciaPregunta> instancias = InstanciaPregunta.list("intento.id = ?1", intento.id);

        // Asegurar que existan objetos Respuesta (si alguna quedó sin enviar, cuenta como incorrecta)
        Map<Long, Respuesta> existentes = Respuesta.<Respuesta>list("instanciaPregunta.intento.id = ?1", intento.id)
                .stream().collect(Collectors.toMap(r -> r.instanciaPregunta.id, r -> r));

        for (InstanciaPregunta ip : instancias) {
            existentes.computeIfAbsent(ip.id, k -> {
                Respuesta r = new Respuesta();
                r.instanciaPregunta = ip;
                r.chosenKey = null;
                r.isCorrect = false;
                r.persist();
                return r;
            });
        }

        long correctas = existentes.values().stream().filter(r -> r.isCorrect).count();
        long total = instancias.size();

        intento.maxPoints = BigDecimal.valueOf(total);
        intento.scorePoints = BigDecimal.valueOf(correctas);
        intento.score = total == 0 ? BigDecimal.ZERO :
                BigDecimal.valueOf(correctas * 100.0 / total).setScale(2, RoundingMode.HALF_UP);
        intento.persist();
    }

    private boolean elegirCorrecta(InstanciaPregunta ip, String chosenKey) {
        if (chosenKey == null) return false;
        return chosenKey.equalsIgnoreCase(ip.llaveCorrecta);
    }
}
