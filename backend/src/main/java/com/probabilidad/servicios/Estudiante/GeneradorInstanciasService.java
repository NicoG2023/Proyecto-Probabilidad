package com.probabilidad.servicios.Estudiante;

import java.text.DecimalFormat;
import java.util.*;
import java.util.stream.Collectors;

import com.probabilidad.entidades.InstanciaPregunta;
import com.probabilidad.entidades.IntentoQuiz;
import com.probabilidad.entidades.PlantillaPregunta;
import com.probabilidad.util.ExprEval;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;

/**
 * Servicio de generación de instancias de preguntas para el flujo de ESTUDIANTE.
 *
 * Responsabilidad:
 *  - A partir de una PlantillaPregunta y el seed del Intento, sortear parámetros,
 *    interpolar el enunciado, construir opciones y determinar la llave correcta.
 *
 * Modos de generación soportados (se detectan vía option_schema):
 *
 * (1) MODO ESTÁTICO (compatibilidad): option_schema.opciones_base
 *     - Cuando option_schema contiene un objeto {"A":"...", "B":"...", ...}
 *       se interpolan los textos con {param}, se copian tal cual y la llave correcta
 *       queda igual a correctKey de la plantilla.
 *
 * (2) MODO FÓRMULA (recomendado): option_schema.mode = "mcq_auto" + "correct_expr"
 *     - Se evalúa correct_expr usando los params sorteados (con ExprEval).
 *     - (Opcional) Se evalúan distractor_exprs: lista de expresiones para distractores.
 *     - Si no hay distractor_exprs suficientes, se generan distractores alrededor
 *       del valor correcto (con "spread" relativo).
 *     - Se barajan todas las opciones y se asignan etiquetas A,B,C,... determinísticamente
 *       con el seed del intento, fijando la llaveCorrecta para ESA instancia.
 *
 * Campos esperados en option_schema para mcq_auto:
 * {
 *   "mode": "mcq_auto",
 *   "correct_expr": "expresión con variables de params",
 *   "distractor_exprs": ["exp1", "exp2"...], // opcional
 *   "num_options": 4,
 *   "format": "number",                       // number | integer | percent
 *   "decimals": 4,
 *   "spread": 0.15                            // amplitud relativa para distractores generados
 * }
 *
 * Determinismo:
 * - Se usa el seed del Intento para que el resultado sea reproducible (apelaciones).
 * - Para evitar colisiones entre preguntas, se deriva el seed con el índice 'i' o un offset.
 */
@ApplicationScoped
public class GeneradorInstanciasService {

    /** Etiquetas estándar para opciones de múltiples respuestas. */
    private static final List<String> LABELS = List.of("A", "B", "C", "D", "E", "F");

    /**
     * Genera y persiste las instancias de pregunta para un intento dado.
     * Nota: transaccional para garantizar consistencia (todas las preguntas del intento).
     */
    @Transactional
    public void generarInstanciasParaIntento(IntentoQuiz intento) {
        // Traer TODAS las plantillas del quiz de este intento
        List<PlantillaPregunta> templates = PlantillaPregunta
                .<PlantillaPregunta>list("quiz.id = ?1", intento.quiz.id);

        // RNG determinista por intento
        Random rndGlobal = new Random(intento.seed.intValue());

        for (int i = 0; i < templates.size(); i++) {
            PlantillaPregunta t = templates.get(i);

            // 1) Sortear parámetros según param_schema, usando RNG derivado por pregunta
            Random rndParams = new Random(rndGlobal.nextLong()); // derivado pero estable dentro del intento
            Map<String, Object> params = sortearParametros(t.paramSchema, rndParams);

            // 2) Interpolar enunciado con {param}
            String stemInterpolado = interpolar(t.stemMd, params);

            // ===================== MODO (1): ESTÁTICO CON opciones_base =====================
            // Si option_schema incluye "opciones_base", usamos ese mapa como base textual.
            // Esto mantiene compatibilidad con tu diseño original.
            Object rawBase = t.optionSchema != null ? t.optionSchema.get("opciones_base") : null;
            if (rawBase instanceof Map<?, ?> rawMap) {
                Map<String, String> optsBase = safeStringMap(rawMap);

                // Interpolar placeholders en las opciones (si contienen {param})
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
                ip.llaveCorrecta = t.correctKey; // La llave correcta viene de la plantilla
                ip.persist();
                continue; // ya terminamos esta plantilla
            }

            // ===================== MODO (2): FÓRMULA (mcq_auto + correct_expr) =====================
            String mode = optString(t.optionSchema, "mode", "mcq_auto");
            boolean esAuto = "mcq_auto".equalsIgnoreCase(mode);
            boolean tieneCorrectExpr = t.optionSchema != null && t.optionSchema.containsKey("correct_expr");

            if (esAuto && tieneCorrectExpr) {
                // Configuración de formato / cantidad de opciones
                int numOptions = optInt(t.optionSchema, "num_options", 4);
                String fmt = optString(t.optionSchema, "format", "number"); // number | integer | percent
                int decimals = optInt(t.optionSchema, "decimals", 4);
                double spread = optDouble(t.optionSchema, "spread", 0.15);

                // a) Evaluar la expresión de la respuesta correcta con los params sorteados
                String correctExpr = String.valueOf(t.optionSchema.get("correct_expr"));
                double correctValue = ExprEval.eval(correctExpr, params);

                // b) Evaluar distractores por expresión si existen
                List<Double> valores = new ArrayList<>();
                List<String> textos = new ArrayList<>();

                // Insertar primero el correcto (índice 0)
                valores.add(correctValue);
                textos.add(formatValue(correctValue, fmt, decimals));

                Object dRaw = t.optionSchema.get("distractor_exprs");
                if (dRaw instanceof List<?> exprList) {
                    for (Object de : exprList) {
                        if (de != null) {
                            double v = ExprEval.eval(String.valueOf(de), params);
                            valores.add(v);
                            textos.add(formatValue(v, fmt, decimals));
                        }
                    }
                }

                // c) Si aún faltan distractores para llegar a numOptions, generarlos alrededor del valor correcto
                int faltan = Math.max(0, numOptions - valores.size());
                if (faltan > 0) {
                    Random rndDistr = new Random(intento.seed.intValue() + 37L * (i + 1));
                    List<Double> extra = generarDistractores(correctValue, faltan, spread, "around", rndDistr);
                    for (double v : extra) {
                        valores.add(v);
                        textos.add(formatValue(v, fmt, decimals));
                    }
                }

                // d) Barajar opciones de forma determinista y asignar etiquetas A, B, C, ...
                List<Integer> idx = new ArrayList<>();
                int limite = Math.min(numOptions, textos.size());
                for (int j = 0; j < limite; j++) idx.add(j);

                // RNG derivado para el shuffle (determinista por intento + posición i)
                Collections.shuffle(idx, new Random(intento.seed.intValue() ^ (i * 104729L)));

                Map<String, String> opcionesTxt = new LinkedHashMap<>();
                String llaveCorrecta = null;
                for (int j = 0; j < idx.size(); j++) {
                    String label = LABELS.get(j);                 // A,B,C,...
                    int k = idx.get(j);                           // índice original en valores/textos
                    opcionesTxt.put(label, textos.get(k));
                    if (k == 0) {                                 // k==0 es la opción correcta antes de barajar
                        llaveCorrecta = label;
                    }
                }

                // e) Persistir instancia ya materializada con su llaveCorrecta
                InstanciaPregunta ip = new InstanciaPregunta();
                ip.intento = intento;
                ip.plantilla = t;
                ip.stemMd = stemInterpolado;
                ip.params = params;
                ip.opciones = opcionesTxt;
                ip.llaveCorrecta = Objects.requireNonNull(llaveCorrecta, "No se pudo determinar la llave correcta");
                ip.persist();
                continue; // siguiente plantilla
            }

            // 2.b) MODO PAREJA: "mcq_auto_pair" → dos resultados en un mismo texto de opción
            if ("mcq_auto_pair".equalsIgnoreCase(mode) && t.optionSchema != null
                    && t.optionSchema.containsKey("left_expr") && t.optionSchema.containsKey("right_expr")) {

                // Config
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

                // a) calcular par correcto
                double L = ExprEval.eval(leftExpr, params);
                double R = ExprEval.eval(rightExpr, params);
                String correctText = formatValue(L, lf, ld) + sep + formatValue(R, rf, rd);

                // b) construir lista (correcto + distractores por expresiones si existen)
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
                                textos.add(txt);
                                correctoFlag.add(Boolean.FALSE);
                            }
                        }
                    }
                }

                // c) si faltan distractores, generarlos alrededor (independiente por componente)
                int faltan = Math.max(0, numOptions - textos.size());
                Random rndPair = new Random(intento.seed.intValue() + 97L * (i+1));
                for (int d = 0; d < faltan; d++) {
                    double lCand = L * (1.0 + (rndPair.nextBoolean() ? 1 : -1) * rndPair.nextDouble() * spreadL);
                    double rCand = R * (1.0 + (rndPair.nextBoolean() ? 1 : -1) * rndPair.nextDouble() * spreadR);
                    String txt = formatValue(lCand, lf, ld) + sep + formatValue(rCand, rf, rd);
                    // evitar duplicados exactos
                    if (!textos.contains(txt)) {
                        textos.add(txt);
                        correctoFlag.add(Boolean.FALSE);
                    } else {
                        d--; // reintenta
                    }
                }

                // d) barajar determinísticamente
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
                ip.persist();
                continue;
            }

            // ===================== FALLBACK =====================
            // Si no hay opciones_base ni correct_expr, persistimos enunciado + params.
            // (La correctKey del template se mantiene por compatibilidad, aunque no haya opciones.)
            InstanciaPregunta ip = new InstanciaPregunta();
            ip.intento = intento;
            ip.plantilla = t;
            ip.stemMd = stemInterpolado;
            ip.params = params;
            ip.opciones = Collections.emptyMap();
            ip.llaveCorrecta = t.correctKey;
            ip.persist();
        }
    }

    // ---------------------------------------------------------------------
    // ------------------------ HELPERS DE SCHEMA --------------------------
    // ---------------------------------------------------------------------

    /** Obtiene un string de option_schema o devuelve el valor por defecto. */
    private static String optString(Map<String, Object> m, String k, String def) {
        if (m == null) return def;
        Object v = m.get(k);
        return v instanceof String s ? s : def;
    }

    /** Obtiene un entero de option_schema o devuelve el valor por defecto. */
    private static int optInt(Map<String, Object> m, String k, int def) {
        if (m == null) return def;
        Object v = m.get(k);
        return v instanceof Number n ? n.intValue() : def;
    }

    /** Obtiene un double de option_schema o devuelve el valor por defecto. */
    private static double optDouble(Map<String, Object> m, String k, double def) {
        if (m == null) return def;
        Object v = m.get(k);
        return v instanceof Number n ? n.doubleValue() : def;
    }

    /**
     * Convierte de forma segura un Map<?,?> a Map<String,String>,
     * filtrando solo entradas cuyo key y value son String.
     */
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

    // ---------------------------------------------------------------------
    // -------------- PARÁMETROS ALEATORIOS + INTERPOLACIÓN ----------------
    // ---------------------------------------------------------------------

    /**
     * Sortea parámetros a partir de un schema JSON:
     *  - {"values":[...]}  -> toma uno aleatorio de la lista
     *  - {"min":a,"max":b} -> entero aleatorio en [a..b]
     *  - constante         -> deja el valor tal cual
     */
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
                    // Si es un objeto más complejo, lo almacenamos tal cual.
                    out.put(k, m);
                }
            } else {
                // Constante directa (string, número, etc.)
                out.put(k, spec);
            }
        }
        return out;
    }

    /**
     * Reemplaza placeholders "{clave}" en el enunciado u opción con el valor correspondiente en params.
     * Ej: "La prob es {p}" con params.get("p") = 0.3 → "La prob es 0.3".
     */
    private String interpolar(String txt, Map<String, Object> params) {
        if (txt == null) return null;
        String out = txt;

        // Busca {nombre|filtro[:dec]} o {nombre}
        // Ej: {p1|percent}, {p1|percent:2}, {k|int}
        for (Map.Entry<String, Object> e : params.entrySet()) {
            String key = e.getKey();
            Object val = e.getValue();

            // básico {key}
            out = out.replace("{" + key + "}", String.valueOf(val));

            // percent sin decimales
            out = out.replace("{" + key + "|percent}", formatPercent(val, 0));
            // percent con decimales 1..3 (puedes ampliar)
            out = out.replace("{" + key + "|percent:1}", formatPercent(val, 1));
            out = out.replace("{" + key + "|percent:2}", formatPercent(val, 2));
            out = out.replace("{" + key + "|percent:3}", formatPercent(val, 3));

            // entero
            out = out.replace("{" + key + "|int}", String.valueOf(Math.round(asDouble(val))));
        }
        return out;
    }

    private String formatPercent(Object v, int dec) {
        double pct = asDouble(v) * 100.0;
        StringBuilder pat = new StringBuilder("0");
        if (dec > 0) { pat.append("."); for (int i=0;i<dec;i++) pat.append("0"); }
        java.text.DecimalFormat df = new java.text.DecimalFormat(pat.toString());
        return df.format(pct) + " %";
    }

    private double asDouble(Object o) {
        if (o instanceof Number n) return n.doubleValue();
        return Double.parseDouble(String.valueOf(o));
    }

    // ---------------------------------------------------------------------
    // ----------------- DISTRACTORES Y FORMATEO DE OPCIONES ---------------
    // ---------------------------------------------------------------------

    /**
     * Genera 'howMany' distractores alrededor de 'correct', multiplicándolo
     * por (1 ± delta), donde delta ~ U(0, spread), con signo aleatorio.
     * Evita duplicados cercanos al valor correcto y entre sí.
     *
     * @param correct  valor correcto
     * @param howMany  cantidad de distractores a generar
     * @param spread   amplitud relativa (ej: 0.15 → ±15%)
     * @param mode     reservado para sesgos ("around" por ahora)
     * @param rnd      RNG
     */
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
                // evitar valores prácticamente iguales
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

    /**
     * Formatea un valor numérico según el "format" elegido:
     *  - "integer": redondea a entero
     *  - "percent": multiplica por 100 y añade " %"
     *  - "number" (default): usa decimales fijos
     */
    private String formatValue(double v, String fmt, int decimals) {
        if ("integer".equalsIgnoreCase(fmt)) {
            return String.valueOf(Math.round(v));
        }
        if ("percent".equalsIgnoreCase(fmt)) {
            double pct = v * 100.0;
            return new DecimalFormat(pattern(decimals)).format(pct) + " %";
        }
        // number (default)
        return new DecimalFormat(pattern(decimals)).format(v);
    }

    /** Construye patrón "0.00..." con 'decimals' posiciones decimales. */
    private String pattern(int decimals) {
        StringBuilder sb = new StringBuilder("0");
        if (decimals > 0) {
            sb.append(".");
            for (int i = 0; i < decimals; i++) sb.append("0");
        }
        return sb.toString();
    }
}
