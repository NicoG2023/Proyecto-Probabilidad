package com.probabilidad.servicios.Estudiante;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.probabilidad.entidades.IntentoQuiz;
import com.probabilidad.entidades.dominio.EstadoIntento;
import com.probabilidad.entidades.dominio.TipoCorte;

import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class EstadisticasService {

    public Map<String, Object> resumenDelAlumno(Long alumnoId) {
        Map<String, Object> out = new HashMap<>();
        List<IntentoQuiz> intentos = IntentoQuiz.list("studentId = ?1 and status = ?2",
                alumnoId, EstadoIntento.PRESENTADO);

        out.put("intentos", intentos.size());
        double promedio = intentos.stream()
                .map(i -> i.score != null ? i.score.doubleValue() : 0d)
                .mapToDouble(Double::doubleValue).average().orElse(0d);
        out.put("promedio", BigDecimal.valueOf(promedio).setScale(2, RoundingMode.HALF_UP));

        // Promedio por corte (simple)
        Map<TipoCorte, Double> porCorte = new HashMap<>();
        for (TipoCorte c : TipoCorte.values()) {
            double p = intentos.stream()
                    .filter(i -> i.quiz != null && i.quiz.corte == c && i.score != null)
                    .mapToDouble(i -> i.score.doubleValue())
                    .average().orElse(0d);
            porCorte.put(c, p);
        }
        out.put("promedioPorCorte", porCorte);
        return out;
    }
}
