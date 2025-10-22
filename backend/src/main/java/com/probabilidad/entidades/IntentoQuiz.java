package com.probabilidad.entidades;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.probabilidad.entidades.dominio.EstadoIntento;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;

@Entity
@Table(name = "intento_quiz",
       indexes = {
            @Index(name = "ix_intentos_quiz", columnList = "quiz_id"),
            @Index(name = "ix_intentos_estudiante", columnList = "student_id")
       })
public class IntentoQuiz extends PanacheEntityBase {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "quiz_id")
    public Quiz quiz;

    @Column(name = "student_id", nullable = false)
    public Long studentId;

    @Column(name = "seed", nullable = false)
    public Long seed;

    @Column(name = "generator_version", nullable = false)
    public String generatorVersion = "v1";

    @Column(name = "started_at", nullable = false)
    public LocalDateTime startedAt = LocalDateTime.now();

    @Column(name = "submitted_at")
    public LocalDateTime submittedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    public EstadoIntento status = EstadoIntento.EN_PROGRESO;

    // Puntos y nota (0–100)
    @Column(name = "max_points")
    public BigDecimal maxPoints;

    @Column(name = "score_points")
    public BigDecimal scorePoints;

    @Column(name = "score")
    public BigDecimal score;

    @Column(name = "time_limit_sec")
    public Integer timeLimitSec;

    @Column(name = "submitted_ip")
    public String submittedIp; // usa INET en SQL; aquí String es suficiente

    @Column(name = "user_agent")
    public String userAgent;
}
