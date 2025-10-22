package com.probabilidad.entidades;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.List;
import java.util.Map;

@Entity
@Table(name = "question_templates")
public class PlantillaPregunta extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "quiz_id")
    public Quiz quiz;

    @Column(name = "stem_md", nullable = false, columnDefinition = "text")
    public String stemMd;

    @Column(name = "explanation_md", columnDefinition = "text")
    public String explanationMd;

    @Column(name = "family", nullable = false)
    public String family;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "param_schema", nullable = false, columnDefinition = "jsonb")
    public Map<String, Object> paramSchema;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "option_schema", nullable = false, columnDefinition = "jsonb")
    public Map<String, Object> optionSchema;

    @Column(name = "correct_key", nullable = false)
    public String correctKey;

    @Column(name = "version", nullable = false)
    public int version = 1;

    @Column(name = "difficulty")
    public String difficulty;

    @ElementCollection
    @CollectionTable(name = "question_template_topics",
            joinColumns = @JoinColumn(name = "template_id"))
    @Column(name = "topic")
    public List<String> topics;
}
