package com.probabilidad.dto;

import java.util.List;

public class PracticeAnswerMeta {

    // Modo: "mcq_auto", "open_numeric", "mcq_auto_pair", "open_text"
    public String mode;

    // ====== NUMÉRICO SIMPLE (mcq_auto / open_numeric) ======
    public Double value;        // valor esperado
    public Double tolAbs;       // tolerancia absoluta
    public Double tolPct;       // tolerancia en %
    public String format;       // "number", "fraction", "percent", "latex", etc.
    public Integer decimals;    // # decimales
    public Integer maxDenominator; // para fracciones
    public String display;      // texto que se muestra como "correcto"

    // ====== PAR NUMÉRICO (mcq_auto_pair) ======
    public Double leftValue;
    public Double rightValue;

    public Double leftTolAbs;
    public Double rightTolAbs;

    public Double leftTolPct;
    public Double rightTolPct;

    public String leftFormat;
    public String rightFormat;

    public Integer leftDecimals;
    public Integer rightDecimals;

    public Integer leftMaxDenominator;
    public Integer rightMaxDenominator;

    public String leftDisplay;
    public String rightDisplay;

    public String sep; // separador usado en display: " , ", " y ", etc.

    // ====== TEXTO (open_text) ======
    public String textFormat;     // "latex" o "plain" (para normalizar)
    public String canonical;      // forma canónica
    public List<String> accept;   // respuestas aceptadas
    public List<String> regex;    // patrones regex
    public Boolean caseSensitive; // default: false
    public Boolean trim;          // default: true
    public String latexPreview;   // opcional: para mostrar en el frontend
}
