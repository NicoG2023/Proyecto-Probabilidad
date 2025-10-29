package com.probabilidad.servicios.Estudiante;

import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

import com.probabilidad.entidades.Quiz;
import com.probabilidad.entidades.dominio.TipoCorte;

import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class QuizService {

    /** Lista quices activos (para catálogo en el frontend). */
    public List<Quiz> listarQuicesActivos() {
        return Quiz.list("esActivo = ?1", true);
    }

    /** Obtiene un quiz activo por corte exacto (C1, C2, C3A o C3B). */
    public Quiz obtenerActivoPorCorte(TipoCorte corte) {
        return Quiz.find("corte = ?1 and esActivo = true", corte).firstResult();
    }

    /**
     * Cuando el estudiante pide "tercer corte" sin modelo,
     * el backend elige aleatoriamente entre C3A y C3B activos.
     */
    public Quiz elegirC3Aleatorio() {
        Quiz c3a = obtenerActivoPorCorte(TipoCorte.C3A);
        Quiz c3b = obtenerActivoPorCorte(TipoCorte.C3B);
        if (c3a == null && c3b == null) return null;
        if (c3a == null) return c3b;
        if (c3b == null) return c3a;
        return ThreadLocalRandom.current().nextBoolean() ? c3a : c3b;
    }

    /** Elige el quiz según el corte solicitado. Si corte==C3A/C3B respeta eso; si ya trataste "C3" en el recurso, llama a elegirC3Aleatorio(). */
    public Quiz elegirQuizActivoPorCorte(TipoCorte corteSolicitado, boolean usarAleatorioEnC3) {
        if (usarAleatorioEnC3) {            // el cliente pidió "C3"
            return elegirC3Aleatorio();
        }
        return obtenerActivoPorCorte(corteSolicitado); // C1, C2, C3A o C3B
    }
}
