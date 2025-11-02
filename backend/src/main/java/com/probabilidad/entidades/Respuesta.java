package com.probabilidad.entidades;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "respuestas")
public class Respuesta extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "instancia_pregunta_id")
    public InstanciaPregunta instanciaPregunta;

    // MCQ (opcional para abiertas)
    @Column(name = "chosen_key")
    public String chosenKey;

    // Abiertas
    @Column(name = "chosen_value")
    public String chosenValue;

    @Column(name = "chosen_number", precision = 38, scale = 10)
    public BigDecimal chosenNumber;

    // Evaluación
    @Column(name = "is_correct", nullable = false)
    public boolean isCorrect;

    @Column(name = "partial_points", precision = 10, scale = 4, nullable = false)
    public BigDecimal partialPoints;
}
