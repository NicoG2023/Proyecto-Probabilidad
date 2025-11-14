package com.probabilidad.dto;

import java.math.BigDecimal;
import java.util.List;

public class PreviewQuizDto {

    public Long intentoId;
    public Long quizId;
    public String quizTitulo;

    public String estudianteUsername;
    public String estudianteEmail;

    public String estado; // PRESENTADO, etc

    // ← ahora BigDecimal
    public BigDecimal nota;

    public List<PreviewPreguntaDto> preguntas;
}
