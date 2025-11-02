package com.probabilidad.entidades;

import java.util.Map;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;

@Entity
@Table(name = "instancias_pregunta")
public class InstanciaPregunta extends PanacheEntityBase {

    public enum TipoInstancia { MCQ, OPEN_NUM, OPEN_TEXT }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "intento_id")
    public IntentoQuiz intento;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "template_id")
    public PlantillaPregunta plantilla;

    @Column(name = "stem_md", nullable = false, columnDefinition = "text")
    public String stemMd;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "params", nullable = false, columnDefinition = "jsonb")
    public Map<String, Object> params;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "opciones", nullable = false, columnDefinition = "jsonb")
    public Map<String, String> opciones;

    @Column(name = "llave_correcta")
    public String llaveCorrecta; // puede ser NULL en abiertas

    // >>> NUEVOS CAMPOS <<<
    @Enumerated(EnumType.STRING)
    @Column(name = "tipo", nullable = false, length = 20)
    public TipoInstancia tipo;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "correct_value", columnDefinition = "jsonb")
    public Map<String, Object> correctValue; // opcional (null si MCQ)
}