package com.probabilidad.entidades;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.Map;

@Entity
@Table(name = "instancias_pregunta") // cambia si tu tabla tiene otro nombre
public class InstanciaPregunta extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "intento_id") // FK a intento
    public IntentoQuiz intento;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "template_id") // FK a plantilla
    public PlantillaPregunta plantilla;

    @Column(name = "stem_md", nullable = false, columnDefinition = "text")
    public String stemMd;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "params", nullable = false, columnDefinition = "jsonb")
    public Map<String, Object> params;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "opciones", nullable = false, columnDefinition = "jsonb")
    public Map<String, String> opciones;

    @Column(name = "llave_correcta", nullable = false)
    public String llaveCorrecta;
}
