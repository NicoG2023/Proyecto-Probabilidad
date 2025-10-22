package com.probabilidad.entidades;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;

@Entity
@Table(name = "respuestas") // cambia si tu tabla tiene otro nombre
public class Respuesta extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "instancia_pregunta_id") // FK a instancia
    public InstanciaPregunta instanciaPregunta;

    @Column(name = "chosen_key", nullable = false)
    public String chosenKey;

    @Column(name = "is_correct", nullable = false)
    public boolean isCorrect;
}
