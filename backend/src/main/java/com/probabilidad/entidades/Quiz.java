package com.probabilidad.entidades;

import java.time.LocalDateTime;

import com.probabilidad.entidades.dominio.TipoCorte;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;

@Entity
@Table(name = "quices")
public class Quiz extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "corte", nullable = false)
    public TipoCorte corte;

    @Column(name = "titulo", nullable = false, columnDefinition = "TEXT")
    public String titulo;

    @Column(name = "es_activo", nullable = false)
    public boolean esActivo = true;

    @Column(name = "creado_en")
    public LocalDateTime creadoEn;
    
}
