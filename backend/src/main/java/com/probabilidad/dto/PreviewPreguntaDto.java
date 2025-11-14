package com.probabilidad.dto;

import java.util.Map;

public class PreviewPreguntaDto {
    public Long instanciaId;
    public String enunciado;

    // Solo para MCQ; para abiertas será null
    public Map<String, String> opciones;

    public String tipo; // "MCQ", "OPEN_TEXT", "OPEN_NUM"

    public String opcionMarcada;     // MCQ
    public String opcionCorrecta;    // MCQ

    public String valorIngresado;    // OPEN_TEXT
    public String valorEsperado;    

    public Double numeroIngresado;   // OPEN_NUM
    public Double numeroEsperado;    

    public boolean esCorrecta;
}
