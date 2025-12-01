package com.probabilidad.servicios.Estudiante;

import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import com.probabilidad.dto.PracticeAnswerMeta;
import com.probabilidad.dto.PracticeCheckResultDto;
import com.probabilidad.dto.PracticeQuestionDto;
import com.probabilidad.entidades.PlantillaPregunta;
import com.probabilidad.util.ExprEval;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.ws.rs.NotFoundException;

@ApplicationScoped
public class PracticaService {

    @Inject
    EntityManager em;

    @Inject
    GeneradorInstanciasService generador;

    // ===================== API PRINCIPAL =====================

    public PracticeQuestionDto buildQuestion(long templateId,
                                             Map<String,Object> paramOverrides) {
        PlantillaPregunta t = em.find(PlantillaPregunta.class, templateId);
        if (t == null) {
            throw new NotFoundException("Template no encontrado");
        }

        Map<String,Object> schema = t.paramSchema;
        Map<String,Object> params = aplicarOverrides(schema, paramOverrides);

        // VALIDACIÓN EXTRA POR FAMILIA
        if ("multinomial_3".equalsIgnoreCase(t.family)) {
            double pCovid   = ((Number) params.get("p_covid")).doubleValue();
            double pOmicron = ((Number) params.get("p_omicron")).doubleValue();
            double pN1H1    = ((Number) params.get("p_n1h1")).doubleValue();

            // Solo rango [0,1] – YA NO forzamos sum = 1 ni lanzamos error por eso
            if (pCovid < 0 || pOmicron < 0 || pN1H1 < 0 ||
                pCovid > 1 || pOmicron > 1 || pN1H1 > 1) {
                throw new IllegalArgumentException("Las probabilidades deben estar entre 0 y 1.");
            }
        }

        String stem = generador.interpolar(t.stemMd, params);
        String explanation = generador.interpolar(t.explanationMd, params);
        PracticeAnswerMeta answerMeta = buildAnswerMeta(t, params);

        PracticeQuestionDto dto = new PracticeQuestionDto();
        dto.templateId = templateId;
        dto.stemMd = stem;
        dto.params = params;
        dto.explanationMd = explanation;
        dto.answerMeta = answerMeta;
        return dto;
    }


    public PracticeCheckResultDto checkAnswer(long templateId,
                                              Map<String,Object> params,
                                              String studentAnswerRaw) {
        PlantillaPregunta t = em.find(PlantillaPregunta.class, templateId);
        if (t == null) throw new NotFoundException("Template no encontrado");

        PracticeAnswerMeta meta = buildAnswerMeta(t, params);

        PracticeCheckResultDto res = new PracticeCheckResultDto();

        if (meta == null) {
            res.isCorrect = false;
            res.correctDisplay = null;
            res.explanationMd = generador.interpolar(t.explanationMd, params);
            return res;
        }

        boolean isCorrect = evaluar(meta, studentAnswerRaw);

        res.isCorrect = isCorrect;
        res.correctDisplay = meta.display;
        res.explanationMd = generador.interpolar(t.explanationMd, params);
        return res;
    }

    // ===================== HELPERS DE PARAMS =====================

    private Map<String,Object> aplicarOverrides(Map<String,Object> schema,
                                                Map<String,Object> overrides) {
        Map<String,Object> out = new LinkedHashMap<>();
        if (schema == null) return out;

        for (String k : schema.keySet()) {
            Object spec = schema.get(k);
            Object ov = overrides != null ? overrides.get(k) : null;

            // -------------------------------
            // 1) Caso con "values": sugeridos
            // -------------------------------
            if (spec instanceof Map<?,?> m && m.containsKey("values")) {
                @SuppressWarnings("unchecked")
                List<Object> vals = (List<Object>) m.get("values");

                // ¿El override es numérico? → usarlo dentro de un rango razonable
                if (ov instanceof Number numOv) {
                    double v = numOv.doubleValue();

                    // rango a partir de la lista de values (solo numéricos)
                    double min = Double.POSITIVE_INFINITY;
                    double max = Double.NEGATIVE_INFINITY;
                    for (Object oVal : vals) {
                        if (oVal instanceof Number nVal) {
                            double d = nVal.doubleValue();
                            if (d < min) min = d;
                            if (d > max) max = d;
                        }
                    }
                    // si no se pudo calcular nada, cae al default
                    if (!Double.isFinite(min) || !Double.isFinite(max)) {
                        out.put(k, vals.isEmpty() ? null : vals.get(0));
                        continue;
                    }

                    // clamp al rango [min, max]
                    if (v < min) v = min;
                    if (v > max) v = max;

                    // Si el spec pide enteros, redondeamos
                    boolean asInt = Boolean.TRUE.equals(m.get("integer"))
                                || "int".equalsIgnoreCase(String.valueOf(m.get("type")));
                    if (asInt) {
                        out.put(k, (int) Math.round(v));
                    } else {
                        out.put(k, v);
                    }
                }
                // Si el override coincide EXACTO con uno de los values (caso strings)
                else if (ov != null && vals.contains(ov)) {
                    out.put(k, ov);
                }
                // Sin override válido → usar el primero como default
                else {
                    out.put(k, vals.isEmpty() ? null : vals.get(0));
                }
            }

            // --------------------------------
            // 2) Caso min/max → clamp estándar
            // --------------------------------
            else if (spec instanceof Map<?,?> m && m.containsKey("min") && m.containsKey("max")) {
                int min = ((Number) m.get("min")).intValue();
                int max = ((Number) m.get("max")).intValue();
                int v;
                if (ov instanceof Number n) v = n.intValue();
                else v = min;
                if (v < min) v = min;
                if (v > max) v = max;
                out.put(k, v);
            }

            // --------------------------------
            // 3) Cualquier otro tipo
            // --------------------------------
            else {
                // copia spec como default, pero si el override está presente, úsalo
                out.put(k, ov != null ? ov : spec);
            }
        }
        return out;
    }


    // ===================== META DE RESPUESTA =====================

    private PracticeAnswerMeta buildAnswerMeta(PlantillaPregunta t,
                                               Map<String,Object> params) {

        // Caso especial: P1 – multinomial, queremos que se compare como LaTeX (open_text)
        if ("multinomial_3".equalsIgnoreCase(t.family)) {
            return buildMultinomialLatexMeta(t, params);
        }

        Map<String,Object> opt = t.optionSchema;
        if (opt == null) return null;

        String mode = optString(opt, "mode", "mcq_auto");

        // ----- 1) MCQ numérico / fracción -----
        if ("mcq_auto".equalsIgnoreCase(mode) && opt.containsKey("correct_expr")) {

            String fmt = optString(opt,"format","number");
            int decimals = optInt(opt,"decimals",4);
            int maxDen = optInt(opt,"max_denominator",1000);

            double correctValue = ExprEval.eval(String.valueOf(opt.get("correct_expr")), params);

            PracticeAnswerMeta meta = new PracticeAnswerMeta();
            meta.mode = "mcq_auto";
            meta.value = correctValue;
            meta.format = fmt;
            meta.decimals = decimals;
            meta.maxDenominator = maxDen;

            meta.display = formatNumberForDisplay(correctValue, fmt, decimals, maxDen);
            return meta;
        }

        // ----- 2) OPEN_NUMERIC -----
        if ("open_numeric".equalsIgnoreCase(mode) && opt.containsKey("expected_expr")) {
            double expected = ExprEval.eval(String.valueOf(opt.get("expected_expr")), params);
            double tolAbs = optDouble(opt,"toleranceAbs",0.0);
            double tolPct = optDouble(opt,"tolerancePct",0.0);
            String fmt = optString(opt,"format","number");
            int decimals = optInt(opt,"decimals",4);

            PracticeAnswerMeta meta = new PracticeAnswerMeta();
            meta.mode = "open_numeric";
            meta.value = expected;
            meta.tolAbs = tolAbs;
            meta.tolPct = tolPct;
            meta.format = fmt;
            meta.decimals = decimals;
            meta.display = formatNumberForDisplay(expected, fmt, decimals, optInt(opt,"max_denominator",1000));

            // opcional: latexPreview si viene "latex" en schema
            String latex = optString(opt,"latex", null);
            if (latex != null) {
                meta.latexPreview = generador.interpolar(latex, params);
            }

            return meta;
        }

        // ----- 3) MCQ_AUTO_PAIR (par numérico) -----
        if ("mcq_auto_pair".equalsIgnoreCase(mode)
                && opt.containsKey("left_expr")
                && opt.containsKey("right_expr")) {

            double leftVal  = ExprEval.eval(String.valueOf(opt.get("left_expr")),  params);
            double rightVal = ExprEval.eval(String.valueOf(opt.get("right_expr")), params);

            String leftFmt  = optString(opt,"left_format","number");
            String rightFmt = optString(opt,"right_format","number");

            int leftDec  = optInt(opt,"left_decimals",4);
            int rightDec = optInt(opt,"right_decimals",4);

            int leftMaxDen  = optInt(opt,"left_max_denominator",1000);
            int rightMaxDen = optInt(opt,"right_max_denominator",1000);

            String sep = optString(opt,"sep", " , ");

            PracticeAnswerMeta meta = new PracticeAnswerMeta();
            meta.mode = "mcq_auto_pair";

            meta.leftValue  = leftVal;
            meta.rightValue = rightVal;
            meta.leftFormat = leftFmt;
            meta.rightFormat = rightFmt;
            meta.leftDecimals  = leftDec;
            meta.rightDecimals = rightDec;
            meta.leftMaxDenominator  = leftMaxDen;
            meta.rightMaxDenominator = rightMaxDen;
            meta.sep = sep;

            // tolerancias (si quisieras soportarlas en schema; si no, se usan decimales)
            meta.leftTolAbs  = optDouble(opt,"left_toleranceAbs", 0.0);
            meta.rightTolAbs = optDouble(opt,"right_toleranceAbs",0.0);
            meta.leftTolPct  = optDouble(opt,"left_tolerancePct", 0.0);
            meta.rightTolPct = optDouble(opt,"right_tolerancePct",0.0);

            meta.leftDisplay  = formatNumberForDisplay(leftVal,  leftFmt,  leftDec,  leftMaxDen);
            meta.rightDisplay = formatNumberForDisplay(rightVal, rightFmt, rightDec, rightMaxDen);

            meta.display = meta.leftDisplay + sep + meta.rightDisplay;

            return meta;
        }

        // ----- 4) OPEN_TEXT (texto / LaTeX) -----
        if ("open_text".equalsIgnoreCase(mode)) {
            PracticeAnswerMeta meta = new PracticeAnswerMeta();
            meta.mode = "open_text";

            String fmt = optString(opt,"format","plain");
            meta.textFormat = fmt;
            meta.format = fmt; // reusamos "format"

            Boolean cs = optBoolean(opt,"caseSensitive", false);
            Boolean tr = optBoolean(opt,"trim", true);
            meta.caseSensitive = cs;
            meta.trim = tr;

            Object canonObj = opt.get("canonical");
            if (canonObj instanceof String sCanon) {
                meta.canonical = generador.interpolar(sCanon, params);
            }

            // accept[]
            Object acc = opt.get("accept");
            if (acc instanceof List<?> lst) {
                List<String> accepted = new ArrayList<>();
                for (Object o : lst) {
                    if (o == null) continue;
                    accepted.add(generador.interpolar(String.valueOf(o), params));
                }
                meta.accept = accepted;
            }

            // regex[]
            Object regs = opt.get("regex");
            if (regs instanceof List<?> lst2) {
                List<String> patterns = new ArrayList<>();
                for (Object o : lst2) {
                    if (o == null) continue;
                    patterns.add(String.valueOf(o));
                }
                meta.regex = patterns;
            }

            // latexPreview (para front)
            String latex = optString(opt,"latex", null);
            if (latex == null) {
                // algunos schemas usan "expected_text" o "expected_template"
                latex = optString(opt,"expected_text",
                        optString(opt,"expected_template", null));
            }
            if (latex != null) {
                meta.latexPreview = generador.interpolar(latex, params);
                meta.display = meta.latexPreview;
            } else if (meta.canonical != null) {
                meta.display = meta.canonical;
            }

            return meta;
        }

        // Otros modos se pueden manejar más adelante
        return null;
    }

    /**
     * Caso especial: multinomial_3 (P1) — la respuesta se corrige como expresión LaTeX.
     * Usa 'correct_display' del option_schema como la expresión canónica.
     */
    private PracticeAnswerMeta buildMultinomialLatexMeta(PlantillaPregunta t,
                                                         Map<String,Object> params) {
        Map<String,Object> opt = t.optionSchema;
        String latexTemplate = opt != null ? optString(opt, "correct_display", null) : null;
        String latexExpr = null;
        if (latexTemplate != null) {
            latexExpr = generador.interpolar(latexTemplate, params);
        }

        PracticeAnswerMeta meta = new PracticeAnswerMeta();
        meta.mode = "open_text";
        meta.textFormat = "latex";
        meta.format = "latex";
        meta.caseSensitive = false;
        meta.trim = true;

        meta.canonical = latexExpr;
        meta.latexPreview = latexExpr;
        meta.display = latexExpr;

        return meta;
    }

    // ===================== EVALUACIÓN =====================

    private boolean evaluar(PracticeAnswerMeta meta, String studentRaw) {
        if (meta == null) return false;
        if (studentRaw == null || studentRaw.isBlank()) return false;

        String mode = meta.mode != null ? meta.mode : "mcq_auto";

        // --- A) MCQ_AUTO / OPEN_NUMERIC: numérico simple ---
        if ("mcq_auto".equalsIgnoreCase(mode) || "open_numeric".equalsIgnoreCase(mode)) {
            try {
                double ans = Double.parseDouble(studentRaw.trim());
                return withinTolerance(
                        ans,
                        meta.value != null ? meta.value : 0.0,
                        meta.tolAbs != null ? meta.tolAbs : 0.0,
                        meta.tolPct != null ? meta.tolPct : 0.0,
                        meta.decimals != null ? meta.decimals : 6
                );
            } catch (Exception e) {
                return false;
            }
        }

        // --- B) MCQ_AUTO_PAIR: par de números ---
        if ("mcq_auto_pair".equalsIgnoreCase(mode)) {
            try {
                // separadores básicos: coma o punto y coma
                String[] parts = studentRaw.split("[;,]");
                if (parts.length != 2) return false;

                double leftAns  = Double.parseDouble(parts[0].trim());
                double rightAns = Double.parseDouble(parts[1].trim());

                double leftExpected  = meta.leftValue  != null ? meta.leftValue  : 0.0;
                double rightExpected = meta.rightValue != null ? meta.rightValue : 0.0;

                double leftTolAbs  = meta.leftTolAbs  != null ? meta.leftTolAbs  : 0.0;
                double rightTolAbs = meta.rightTolAbs != null ? meta.rightTolAbs : 0.0;
                double leftTolPct  = meta.leftTolPct  != null ? meta.leftTolPct  : 0.0;
                double rightTolPct = meta.rightTolPct != null ? meta.rightTolPct : 0.0;

                int leftDec  = meta.leftDecimals  != null ? meta.leftDecimals  : 4;
                int rightDec = meta.rightDecimals != null ? meta.rightDecimals : 4;

                boolean okLeft = withinTolerance(leftAns, leftExpected, leftTolAbs, leftTolPct, leftDec);
                boolean okRight = withinTolerance(rightAns, rightExpected, rightTolAbs, rightTolPct, rightDec);

                return okLeft && okRight;
            } catch (Exception e) {
                return false;
            }
        }

        // --- C) OPEN_TEXT ---
        if ("open_text".equalsIgnoreCase(mode)) {
            String format = meta.textFormat != null ? meta.textFormat : "plain";
            boolean cs = meta.caseSensitive != null ? meta.caseSensitive : false;
            boolean tr = meta.trim != null ? meta.trim : true;

            String normAns = normalizeText(studentRaw, format, cs, tr);

            // 1) canonical
            if (meta.canonical != null) {
                String normCanon = normalizeText(meta.canonical, format, cs, tr);
                if (normAns.equals(normCanon)) return true;
            }

            // 2) accept[]
            if (meta.accept != null) {
                for (String acc : meta.accept) {
                    if (acc == null) continue;
                    String normAcc = normalizeText(acc, format, cs, tr);
                    if (normAns.equals(normAcc)) return true;
                }
            }

            // 3) regex[]
            if (meta.regex != null) {
                for (String pat : meta.regex) {
                    if (pat == null) continue;
                    int flags = cs ? 0 : java.util.regex.Pattern.CASE_INSENSITIVE;
                    java.util.regex.Pattern p = java.util.regex.Pattern.compile(pat, flags);
                    if (p.matcher(normAns).matches()) return true;
                }
            }

            return false;
        }

        // Modo no soportado
        return false;
    }

    // ===================== HELPERS LOCALES =====================

    private static String optString(Map<String, Object> m, String k, String def) {
        if (m == null) return def;
        Object v = m.get(k);
        return v instanceof String s ? s : def;
    }

    private static int optInt(Map<String, Object> m, String k, int def) {
        if (m == null) return def;
        Object v = m.get(k);
        return v instanceof Number n ? n.intValue() : def;
    }

    private static double optDouble(Map<String, Object> m, String k, double def) {
        if (m == null) return def;
        Object v = m.get(k);
        return v instanceof Number n ? n.doubleValue() : def;
    }

    private static boolean optBoolean(Map<String, Object> m, String k, boolean def) {
        if (m == null) return def;
        Object v = m.get(k);
        return v instanceof Boolean b ? b : def;
    }

    private static DecimalFormat df(int decimals) {
        var sym = DecimalFormatSymbols.getInstance(Locale.US);
        var pattern = pattern(decimals);
        var df = new DecimalFormat(pattern, sym);
        df.setGroupingUsed(false);
        return df;
    }

    private static String pattern(int decimals) {
        StringBuilder sb = new StringBuilder("0");
        if (decimals > 0) {
            sb.append(".");
            for (int i = 0; i < decimals; i++) sb.append("0");
        }
        return sb.toString();
    }

    private static String toLatexFraction(double value, int maxDenominator) {
        if (Double.isNaN(value) || Double.isInfinite(value)) {
            return String.valueOf(value);
        }

        int sign = value < 0 ? -1 : 1;
        double x = Math.abs(value);

        int bestNum = 0;
        int bestDen = 1;
        double bestErr = Double.MAX_VALUE;

        for (int den = 1; den <= maxDenominator; den++) {
            int num = (int) Math.round(x * den);
            double approx = (double) num / den;
            double err = Math.abs(x - approx);
            if (err < bestErr - 1e-12) {
                bestErr = err;
                bestNum = num;
                bestDen = den;
            }
        }

        if (sign < 0) bestNum = -bestNum;

        if (bestDen == 1) {
            return String.valueOf(bestNum);
        } else {
            return "$\\dfrac{" + bestNum + "}{" + bestDen + "}$";
        }
    }

    private static String formatNumberForDisplay(double value,
                                                 String format,
                                                 int decimals,
                                                 int maxDenominator) {
        if ("fraction".equalsIgnoreCase(format)) {
            return toLatexFraction(value, maxDenominator);
        }
        if ("percent".equalsIgnoreCase(format)) {
            double v = value * 100.0;
            return df(decimals).format(v) + "\\%";
        }
        // default: número
        return df(decimals).format(value);
    }

    private static boolean withinTolerance(double ans,
                                           double expected,
                                           double tolAbs,
                                           double tolPct,
                                           int decimals) {
        double diff = Math.abs(ans - expected);

        if (tolAbs > 0 && diff <= tolAbs) return true;
        if (tolPct > 0 && expected != 0.0
                && diff <= Math.abs(expected) * (tolPct / 100.0)) return true;

        // si no hay tolerancias explícitas, usamos redondeo a "decimals"
        double scale = Math.pow(10.0, decimals);
        long r1 = Math.round(ans * scale);
        long r2 = Math.round(expected * scale);
        return r1 == r2;
    }

    private static String normalizeText(String s,
                                        String format,
                                        boolean caseSensitive,
                                        boolean trim) {
        if (s == null) return null;
        String out = s;

        if (trim) {
            out = out.trim();
        }

        if (!caseSensitive) {
            out = out.toLowerCase(Locale.ROOT);
        }

        if ("latex".equalsIgnoreCase(format)) {
            // quitamos espacios y símbolos "decorativos"
            out = out.replaceAll("\\s+", "");
            out = out
                    .replace("\\,", "")
                    .replace("\\;", "")
                    .replace("\\!", "")
                    .replace("\\ ", "")
                    .replace("~", "")
                    .replace("$", ""); // ignorar delimitadores $...$

            out = out.replace("\\left", "")
                     .replace("\\right", "");
        } else {
            out = out.replaceAll("\\s+", " ");
        }

        return out;
    }
}
