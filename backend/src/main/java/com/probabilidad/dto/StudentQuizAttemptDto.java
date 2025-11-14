// src/main/java/com/probabilidad/dto/StudentQuizAttemptDto.java
package com.probabilidad.dto;

import com.probabilidad.entidades.dominio.EstadoIntento;
import com.probabilidad.entidades.dominio.TipoCorte;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class StudentQuizAttemptDto {

    public Long attemptId;
    public Long quizId;
    public String quizTitle;
    public TipoCorte corte;

    public LocalDateTime startedAt;
    public LocalDateTime submittedAt;
    public EstadoIntento status;

    public BigDecimal maxPoints;
    public BigDecimal scorePoints;
    public BigDecimal score;

    public StudentQuizAttemptDto(Long attemptId,
                                 Long quizId,
                                 String quizTitle,
                                 TipoCorte corte,
                                 LocalDateTime startedAt,
                                 LocalDateTime submittedAt,
                                 EstadoIntento status,
                                 BigDecimal maxPoints,
                                 BigDecimal scorePoints,
                                 BigDecimal score) {
        this.attemptId = attemptId;
        this.quizId = quizId;
        this.quizTitle = quizTitle;
        this.corte = corte;
        this.startedAt = startedAt;
        this.submittedAt = submittedAt;
        this.status = status;
        this.maxPoints = maxPoints;
        this.scorePoints = scorePoints;
        this.score = score;
    }
}
