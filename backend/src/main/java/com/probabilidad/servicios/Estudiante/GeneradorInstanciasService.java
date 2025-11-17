package com.probabilidad.servicios.Estudiante;

import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.util.*;
import java.util.stream.Collectors;

import com.probabilidad.entidades.InstanciaPregunta;
import com.probabilidad.entidades.InstanciaPregunta.TipoInstancia;
import com.probabilidad.entidades.IntentoQuiz;
import com.probabilidad.entidades.PlantillaPregunta;
import com.probabilidad.util.ExprEval;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;

@ApplicationScoped
public class GeneradorInstanciasService {

    private static final List<String> LABELS = List.of("A", "B", "C", "D", "E", "F");

    // ========= Helpers de formato (Locale.US) =========
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

    private String formatPercent(Object v, int dec) {
        double pct = asDouble(v) * 100.0;
        return df(dec).format(pct) + " %";
    }

    private String formatValue(double v, String fmt, int decimals) {
        if ("integer".equalsIgnoreCase(fmt)) {
            return String.valueOf(Math.round(v));
        }
        if ("percent".equalsIgnoreCase(fmt)) {
            double pct = v * 100.0;
            return df(decimals).format(pct) + " %";
        }
        return df(decimals).format(v);
    }

    private double asDouble(Object o) {
        if (o instanceof Number n) return n.doubleValue();
        return Double.parseDouble(String.valueOf(o));
    }

    // ---------------------------------------------------------------------
    // -------------- PARÁMETROS ALEATORIOS + INTERPOLACIÓN ----------------
    // ---------------------------------------------------------------------

    /** Sortea parámetros a partir de un schema JSON. */
    private Map<String, Object> sortearParametros(Map<String, Object> schema, Random rnd) {
        Map<String, Object> out = new LinkedHashMap<>();
        if (schema == null) return out;

        for (String k : schema.keySet()) {
            Object spec = schema.get(k);
            if (spec instanceof Map<?,?> m) {
                if (m.containsKey("values")) {
                    @SuppressWarnings("unchecked")
                    List<Object> vals = (List<Object>) m.get("values");
                    Object v = vals.get(rnd.nextInt(vals.size()));
                    out.put(k, v);
                } else if (m.containsKey("min") && m.containsKey("max")) {
                    int a = ((Number) m.get("min")).intValue();
                    int b = ((Number) m.get("max")).intValue();
                    int v = a + rnd.nextInt(Math.max(1, b - a + 1));
                    out.put(k, v);
                } else {
                    out.put(k, m);
                }
            } else {
                out.put(k, spec);
            }
        }
        return out;
    }

    /**
     * Reemplaza placeholders "{clave}", "{clave|percent[:d]}", "{clave|int}" usando Locale.US.
     */
    private String interpolar(String txt, Map<String, Object> params) {
        if (txt == null) return null;
        String out = txt;

        for (Map.Entry<String, Object> e : params.entrySet()) {
            String key = e.getKey();
            Object val = e.getValue();

            out = out.replace("{" + key + "}", String.valueOf(val));

            out = out.replace("{" + key + "|percent}",     formatPercent(val, 0));
            out = out.replace("{" + key + "|percent:1}",   formatPercent(val, 1));
            out = out.replace("{" + key + "|percent:2}",   formatPercent(val, 2));
            out = out.replace("{" + key + "|percent:3}",   formatPercent(val, 3));

            out = out.replace("{" + key + "|int}", String.valueOf(Math.round(asDouble(val))));
        }
        return out;
    }

    /** Convierte de forma segura un Map<?,?> a Map<String,String>. */
    private static Map<String, String> safeStringMap(Map<?, ?> rawMap) {
        return rawMap.entrySet().stream()
                .filter(e -> e.getKey() instanceof String && e.getValue() instanceof String)
                .collect(Collectors.toMap(
                        e -> (String) e.getKey(),
                        e -> (String) e.getValue(),
                        (a, b) -> a,
                        LinkedHashMap::new
                ));
    }

    /** Distractores alrededor del valor correcto. */
    private List<Double> generarDistractores(double correct, int howMany, double spread, String mode, Random rnd) {
        List<Double> out = new ArrayList<>(howMany);
        if (howMany <= 0) return out;

        for (int i = 0; i < howMany; i++) {
            double cand = correct;
            int tries = 0;
            do {
                double delta = (rnd.nextDouble() * spread);
                if (rnd.nextBoolean()) delta = -delta;
                cand = correct * (1.0 + delta);
                tries++;
            } while ((almostEqual(cand, correct) || containsClose(out, cand)) && tries < 16);

            out.add(cand);
        }
        return out;
    }

    private boolean containsClose(List<Double> list, double v) {
        for (double x : list) if (Math.abs(x - v) <= 1e-10) return true;
        return false;
    }

    private boolean almostEqual(double a, double b) {
        return Math.abs(a - b) <= 1e-10;
    }

    // ---------------------------------------------------------------------
    // ----------------------- GENERACIÓN PRINCIPAL ------------------------
    // ---------------------------------------------------------------------

    @Transactional
    public void generarInstanciasParaIntento(IntentoQuiz intento) {
        List<PlantillaPregunta> templates = PlantillaPregunta
                .<PlantillaPregunta>list("quiz.id = ?1", intento.quiz.id);

        Random rndGlobal = new Random(intento.seed.intValue());

        for (int i = 0; i < templates.size(); i++) {
            PlantillaPregunta t = templates.get(i);

            Random rndParams = new Random(rndGlobal.nextLong());
            Map<String, Object> params = sortearParametros(t.paramSchema, rndParams);
            String stemInterpolado = interpolar(t.stemMd, params);

            // ===== (1) MODO ESTÁTICO: opciones_base =====
            Object rawBase = t.optionSchema != null ? t.optionSchema.get("opciones_base") : null;
            if (rawBase instanceof Map<?, ?> rawMap) {
                Map<String, String> optsBase = safeStringMap(rawMap);

                Map<String, String> opcionesInterpoladas = new LinkedHashMap<>();
                for (Map.Entry<String, String> e : optsBase.entrySet()) {
                    opcionesInterpoladas.put(e.getKey(), interpolar(e.getValue(), params));
                }

                InstanciaPregunta ip = new InstanciaPregunta();
                ip.intento = intento;
                ip.plantilla = t;
                ip.stemMd = stemInterpolado;
                ip.params = params;
                ip.opciones = opcionesInterpoladas;
                ip.llaveCorrecta = t.correctKey;
                ip.tipo = TipoInstancia.MCQ;
                ip.correctValue = null;
                ip.persist();
                continue;
            }

            String mode = optString(t.optionSchema, "mode", "mcq_auto");

            // ===== (2) mcq_auto =====
            boolean esAuto = "mcq_auto".equalsIgnoreCase(mode);
            boolean tieneCorrectExpr = t.optionSchema != null && t.optionSchema.containsKey("correct_expr");

            if (esAuto && tieneCorrectExpr) {
                int numOptions = optInt(t.optionSchema, "num_options", 4);
                String fmt = optString(t.optionSchema, "format", "number");
                int decimals = optInt(t.optionSchema, "decimals", 4);
                double spread = optDouble(t.optionSchema, "spread", 0.15);

                // prefijo y sufijo opcionales (para $, %, etc.)
                String prefix = optString(t.optionSchema, "prefix", "");
                String suffix = optString(t.optionSchema, "suffix", "");

                // NUEVO: denominador máximo para formato "fraction"
                int maxDen = optInt(t.optionSchema, "max_denominator", 1000);

                String correctExpr = String.valueOf(t.optionSchema.get("correct_expr"));
                double correctValue = ExprEval.eval(correctExpr, params);

                // plantillas de display explícitas (se mantienen)
                String correctDisplayTpl = optString(t.optionSchema, "correct_display", null);

                List<String> distractDisplayTpls = new ArrayList<>();
                Object rawDistrDisp = t.optionSchema.get("distractor_display");
                if (rawDistrDisp instanceof List<?> lst) {
                    for (Object o : lst) {
                        distractDisplayTpls.add(o == null ? null : String.valueOf(o));
                    }
                }

                List<Double> valores = new ArrayList<>();
                List<String> textos  = new ArrayList<>();

                // 0) opción correcta
                valores.add(correctValue);
                {
                    String baseText;
                    if (correctDisplayTpl != null) {
                        baseText = interpolar(correctDisplayTpl, params);
                    } else {
                        baseText = "fraction".equalsIgnoreCase(fmt)
                                ? toLatexFraction(correctValue, maxDen)
                                : formatValue(correctValue, fmt, decimals);
                    }
                    textos.add(prefix + baseText + suffix);
                }

                // 1) distractores explícitos
                Object dRaw = t.optionSchema.get("distractor_exprs");
                int dispIdx = 0;
                if (dRaw instanceof List<?> exprList) {
                    for (Object de : exprList) {
                        if (de == null) continue;
                        double v = ExprEval.eval(String.valueOf(de), params);
                        valores.add(v);

                        String dispTpl = (dispIdx < distractDisplayTpls.size())
                                ? distractDisplayTpls.get(dispIdx)
                                : null;
                        dispIdx++;

                        String baseText;
                        if (dispTpl != null) {
                            baseText = interpolar(dispTpl, params);
                        } else {
                            baseText = "fraction".equalsIgnoreCase(fmt)
                                    ? toLatexFraction(v, maxDen)
                                    : formatValue(v, fmt, decimals);
                        }
                        textos.add(prefix + baseText + suffix);
                    }
                }

                // 2) distractores auto-generados
                int faltan = Math.max(0, numOptions - valores.size());
                if (faltan > 0) {
                    Random rndDistr = new Random(intento.seed.intValue() + 37L * (i + 1));
                    List<Double> extra = generarDistractores(correctValue, faltan, spread, "around", rndDistr);
                    for (double v : extra) {
                        valores.add(v);
                        String baseText = "fraction".equalsIgnoreCase(fmt)
                                ? toLatexFraction(v, maxDen)
                                : formatValue(v, fmt, decimals);
                        textos.add(prefix + baseText + suffix);
                    }
                }

                // 3) barajar y construir mapa A,B,C,...
                List<Integer> idx = new ArrayList<>();
                int limite = Math.min(numOptions, textos.size());
                for (int j = 0; j < limite; j++) idx.add(j);
                Collections.shuffle(idx, new Random(intento.seed.intValue() ^ (i * 104729L)));

                Map<String, String> opcionesTxt = new LinkedHashMap<>();
                String llaveCorrecta = null;
                for (int j = 0; j < idx.size(); j++) {
                    String label = LABELS.get(j);
                    int k = idx.get(j);
                    opcionesTxt.put(label, textos.get(k));
                    if (k == 0) {
                        llaveCorrecta = label;
                    }
                }

                InstanciaPregunta ip = new InstanciaPregunta();
                ip.intento = intento;
                ip.plantilla = t;
                ip.stemMd = stemInterpolado;
                ip.params = params;
                ip.opciones = opcionesTxt;
                ip.llaveCorrecta = Objects.requireNonNull(llaveCorrecta, "No se pudo determinar la llave correcta");
                ip.tipo = TipoInstancia.MCQ;
                ip.correctValue = null;
                ip.persist();
                continue;
            }




            // ===== (2.b) mcq_auto_pair =====
            if ("mcq_auto_pair".equalsIgnoreCase(mode) && t.optionSchema != null
                    && t.optionSchema.containsKey("left_expr") && t.optionSchema.containsKey("right_expr")) {

                int numOptions = optInt(t.optionSchema, "num_options", 5);
                String sep = optString(t.optionSchema, "sep", " , ");

                String leftExpr  = String.valueOf(t.optionSchema.get("left_expr"));
                String rightExpr = String.valueOf(t.optionSchema.get("right_expr"));

                String lf = optString(t.optionSchema, "left_format",  "number");
                int    ld = optInt(t.optionSchema,   "left_decimals", 4);
                String rf = optString(t.optionSchema, "right_format", "number");
                int    rd = optInt(t.optionSchema,   "right_decimals",4);

                double spreadL = optDouble(t.optionSchema, "spread_left",  0.15);
                double spreadR = optDouble(t.optionSchema, "spread_right", 0.15);

                // ← NUEVO: leemos la unidad una sola vez
                String unit = optString(t.optionSchema, "unit", null);

                double L = ExprEval.eval(leftExpr, params);
                double R = ExprEval.eval(rightExpr, params);
                String correctText = formatValue(L, lf, ld) + sep + formatValue(R, rf, rd);
                if (unit != null) {
                    correctText = correctText + " " + unit;   // ← APLICAR UNIDAD
                }

                List<String> textos = new ArrayList<>();
                List<Boolean> correctoFlag = new ArrayList<>();

                textos.add(correctText);
                correctoFlag.add(Boolean.TRUE);

                Object dPairsRaw = t.optionSchema.get("distractor_pairs");
                if (dPairsRaw instanceof List<?> dps) {
                    for (Object obj : dps) {
                        if (obj instanceof Map<?,?> mp) {
                            Object le = mp.get("left");
                            Object re = mp.get("right");
                            if (le != null && re != null) {
                                double lVal = ExprEval.eval(String.valueOf(le), params);
                                double rVal = ExprEval.eval(String.valueOf(re), params);
                                String txt = formatValue(lVal, lf, ld) + sep + formatValue(rVal, rf, rd);
                                if (unit != null) {
                                    txt = txt + " " + unit;   // ← APLICAR UNIDAD
                                }
                                textos.add(txt);
                                correctoFlag.add(Boolean.FALSE);
                            }
                        }
                    }
                }

                int faltan = Math.max(0, numOptions - textos.size());
                Random rndPair = new Random(intento.seed.intValue() + 97L * (i+1));
                for (int d = 0; d < faltan; d++) {
                    double lCand = L * (1.0 + (rndPair.nextBoolean() ? 1 : -1) * rndPair.nextDouble() * spreadL);
                    double rCand = R * (1.0 + (rndPair.nextBoolean() ? 1 : -1) * rndPair.nextDouble() * spreadR);
                    String txt = formatValue(lCand, lf, ld) + sep + formatValue(rCand, rf, rd);
                    if (unit != null) {
                        txt = txt + " " + unit;   // ← APLICAR UNIDAD
                    }
                    if (!textos.contains(txt)) {
                        textos.add(txt);
                        correctoFlag.add(Boolean.FALSE);
                    } else {
                        d--;
                    }
                }

                List<Integer> idx = new ArrayList<>();
                for (int j = 0; j < Math.min(numOptions, textos.size()); j++) idx.add(j);
                Collections.shuffle(idx, new Random(intento.seed.intValue() ^ (i * 2654435761L)));

                Map<String, String> opcionesTxt = new LinkedHashMap<>();
                String llaveCorrecta = null;
                for (int j = 0; j < idx.size(); j++) {
                    String label = LABELS.get(j);
                    int k = idx.get(j);
                    opcionesTxt.put(label, textos.get(k));
                    if (correctoFlag.get(k)) {
                        llaveCorrecta = label;
                    }
                }

                InstanciaPregunta ip = new InstanciaPregunta();
                ip.intento = intento;
                ip.plantilla = t;
                ip.stemMd = stemInterpolado;
                ip.params = params;
                ip.opciones = opcionesTxt;
                ip.llaveCorrecta = Objects.requireNonNull(llaveCorrecta, "No se pudo determinar la llave correcta (pair)");
                ip.tipo = TipoInstancia.MCQ;
                ip.correctValue = null;
                ip.persist();
                continue;
            }


            // ===== (3) ABIERTA NUMÉRICA =====
            if ("open_numeric".equalsIgnoreCase(mode) && t.optionSchema != null && t.optionSchema.containsKey("expected_expr")) {
                String expectedExpr = String.valueOf(t.optionSchema.get("expected_expr"));

                String fmt = optString(t.optionSchema, "format", "number");
                int decimals = optInt(t.optionSchema, "decimals", 4);
                double tolAbs = optDouble(t.optionSchema, "toleranceAbs", 0.0);
                double tolPct = optDouble(t.optionSchema, "tolerancePct", 0.0); // 0.5 => 0.5%

                double expected = ExprEval.eval(expectedExpr, params);

                InstanciaPregunta ip = new InstanciaPregunta();
                ip.intento = intento;
                ip.plantilla = t;
                ip.stemMd = stemInterpolado;
                ip.params = params;
                ip.opciones = Collections.emptyMap();
                ip.llaveCorrecta = null;
                ip.tipo = TipoInstancia.OPEN_NUM;

                Map<String,Object> cv = new LinkedHashMap<>();
                cv.put("type","number");
                cv.put("value", expected);
                cv.put("toleranceAbs", tolAbs);
                cv.put("tolerancePct", tolPct);
                cv.put("format", fmt);
                cv.put("decimals", decimals);
                // opcionalmente un latex ya formateado:
                String latexTpl = optString(t.optionSchema, "latex", null);
                if (latexTpl != null) cv.put("latex", interpolar(latexTpl, params));
                ip.correctValue = cv;

                ip.persist();
                continue;
            }

            // ===== (4) ABIERTA DE TEXTO (EXPLÍCITA) =====
            if ("open_text".equalsIgnoreCase(mode)) {
                String expectedText   = optString(t.optionSchema, "expected_text", null);
                String expectedTpl    = optString(t.optionSchema, "expected_template", null);
                String canonicalTpl = optString(t.optionSchema, "canonical", null);
                String canonical = canonicalTpl != null ? interpolar(canonicalTpl, params) : expectedText;
                String format = optString(t.optionSchema, "format", "plain");
                if (expectedText == null && expectedTpl != null) {
                    expectedText = interpolar(expectedTpl, params);
                }

                // accept[]
                List<String> accept = new ArrayList<>();
                Object rawAccept = t.optionSchema.get("accept");
                if (rawAccept instanceof List<?> lst) {
                    for (Object o : lst) {
                        if (o == null) continue;
                        String s = String.valueOf(o);
                        accept.add(interpolar(s, params));
                    }
                }
                // si no vino accept y sí tengo expectedText, úsalo por defecto
                if (accept.isEmpty() && expectedText != null) accept.add(expectedText);

                // regex[]
                List<String> regex = new ArrayList<>();
                Object rawRegex = t.optionSchema.get("regex");
                if (rawRegex instanceof List<?> lst2) {
                    for (Object o : lst2) if (o != null) regex.add(String.valueOf(o));
                }

                boolean caseSensitive = optBool(t.optionSchema, "caseSensitive", false);
                boolean trim = optBool(t.optionSchema, "trim", true);
                String latexTpl = optString(t.optionSchema, "latex", null);
                String latex = latexTpl != null ? interpolar(latexTpl, params) : null;

                InstanciaPregunta ip = new InstanciaPregunta();
                ip.intento = intento;
                ip.plantilla = t;
                ip.stemMd = stemInterpolado;
                ip.params = params;
                ip.opciones = Collections.emptyMap();
                ip.llaveCorrecta = null;
                ip.tipo = TipoInstancia.OPEN_TEXT;

                Map<String,Object> cv = new LinkedHashMap<>();
                cv.put("type", "text");
                if (expectedText != null) cv.put("value", expectedText);
                if (canonical != null)    cv.put("canonical", canonical);
                if (!accept.isEmpty())   cv.put("accept", accept);
                if (!regex.isEmpty())    cv.put("regex", regex);
                cv.put("caseSensitive", caseSensitive);
                cv.put("trim", trim);
                cv.put("format", format);
                if (latex != null)       cv.put("latex", latex);

                ip.correctValue = cv;
                ip.persist();
                continue;
            }

            // ===== FALLBACK → ABIERTA DE TEXTO SIN ESPECIFICACIÓN =====
            InstanciaPregunta ip = new InstanciaPregunta();
            ip.intento = intento;
            ip.plantilla = t;
            ip.stemMd = stemInterpolado;
            ip.params = params;
            ip.opciones = Collections.emptyMap();
            ip.llaveCorrecta = null;
            ip.tipo = TipoInstancia.OPEN_TEXT;
            ip.correctValue = null; // sin auto-corrección
            ip.persist();
        }
    }

    // ---------------------------------------------------------------------
    // ------------------------ HELPERS DE SCHEMA --------------------------
    // ---------------------------------------------------------------------

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

    private static boolean optBool(Map<String, Object> m, String k, boolean def) {
        if (m == null) return def;
        Object v = m.get(k);
        if (v instanceof Boolean b) return b;
        if (v instanceof String s) return Boolean.parseBoolean(s);
        return def;
    }

    // Convierte un double a fracción tipo \dfrac{num}{den}
    // usando una búsqueda simple hasta maxDenominator
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
            // Es un entero
            return String.valueOf(bestNum);
        } else {
            return "$\\dfrac{" + bestNum + "}{" + bestDen + "}$";
        }
    }

    // Renderiza un valor numérico según fmt/decimals/prefix/suffix
    // y soporta format = "fraction"
    private String renderOptionValue(
            double value,
            String fmt,
            int decimals,
            int maxDen,
            String prefix,
            String suffix
    ) {
        String baseText;
        if ("fraction".equalsIgnoreCase(fmt)) {
            baseText = toLatexFraction(value, maxDen);
        } else {
            baseText = formatValue(value, fmt, decimals);
        }
        return prefix + baseText + suffix;
    }

}
