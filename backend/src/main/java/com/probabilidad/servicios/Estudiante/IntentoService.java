package com.probabilidad.servicios.Estudiante;

import java.time.LocalDateTime;
import java.util.List;

import com.probabilidad.entidades.IntentoQuiz;
import com.probabilidad.entidades.Quiz;
import com.probabilidad.entidades.dominio.EstadoIntento;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

@ApplicationScoped
public class IntentoService {

    @Inject QuizService quizService;
    @Inject GeneradorInstanciasService generadorInstanciasService;
    @Inject RespuestaService respuestaService;

    /** Crea intento para el ALUMNO (rol estudiante). */
    @Transactional
    public IntentoQuiz crearIntento(Long alumnoId, Quiz quizElegido) {
        IntentoQuiz intento = new IntentoQuiz();
        intento.quiz = quizElegido;
        intento.studentId = alumnoId;
        intento.seed = (long) (Math.random() * 1_000_000_000L);
        intento.startedAt = LocalDateTime.now();
        intento.status = EstadoIntento.EN_PROGRESO;
        intento.persist();

        // Genera instancias de preguntas determinísticamente con el seed
        generadorInstanciasService.generarInstanciasParaIntento(intento);
        return intento;
    }

    /** Verifica que el intento pertenezca al alumno. */
    public IntentoQuiz obtenerIntentoPropio(Long intentoId, Long alumnoId) {
        IntentoQuiz intento = IntentoQuiz.findById(intentoId);
        if (intento == null || !intento.studentId.equals(alumnoId))
            throw new IllegalArgumentException("Intento inexistente o no pertenece al alumno");
        return intento;
    }

    /** Historial simple del alumno. */
    public List<IntentoQuiz> listarIntentosDelAlumno(Long alumnoId, int page, int size) {
        return IntentoQuiz.find("studentId = ?1 order by startedAt desc", alumnoId)
                .page(page, size).list();
    }

    /** Enviar intento: cierra, califica y devuelve el intento con score. */
    @Transactional
    public IntentoQuiz enviarIntento(Long intentoId, Long alumnoId) {
        IntentoQuiz intento = obtenerIntentoPropio(intentoId, alumnoId);
        if (intento.status != EstadoIntento.EN_PROGRESO) return intento;

        // Calificación (MCQ simple)
        respuestaService.calificarIntento(intento);

        intento.status = EstadoIntento.PRESENTADO;
        intento.submittedAt = LocalDateTime.now();
        intento.persist();
        return intento;
    }
}
