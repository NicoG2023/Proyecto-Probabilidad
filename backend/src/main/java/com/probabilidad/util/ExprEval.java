package com.probabilidad.util;

import net.objecthunter.exp4j.Expression;
import net.objecthunter.exp4j.ExpressionBuilder;
import net.objecthunter.exp4j.function.Function;

import java.util.Locale;
import java.util.Map;

public final class ExprEval {

    private ExprEval() {}

    // --- Funciones personalizadas ---
    private static final Function NCR = new Function("nCr", 2) {
        @Override public double apply(double... args) {
            int n = (int)Math.round(args[0]);
            int r = (int)Math.round(args[1]);
            if (r < 0 || r > n) return 0.0;
            r = Math.min(r, n - r);
            double num = 1.0, den = 1.0;
            for (int i = 1; i <= r; i++) { num *= (n - r + i); den *= i; }
            return num / den;
        }
    };

    private static final Function NPR = new Function("nPr", 2) {
        @Override public double apply(double... args) {
            int n = (int)Math.round(args[0]);
            int r = (int)Math.round(args[1]);
            if (r < 0 || r > n) return 0.0;
            double res = 1.0;
            for (int i = 0; i < r; i++) res *= (n - i);
            return res;
        }
    };

    private static final Function ERF = new Function("erf", 1) {
        @Override public double apply(double... a) { return erf(a[0]); }
    };

    private static final Function PHI = new Function("phi", 1) {
        @Override public double apply(double... a) {
            double z = a[0];
            return 0.5 * (1.0 + erf(z / Math.sqrt(2.0)));
        }
    };

    private static final Function POW = new Function("pow", 2) {
        @Override public double apply(double... a) { return Math.pow(a[0], a[1]); }
    };

    private static final Function EXP = new Function("exp", 1) {
        @Override public double apply(double... a) { return Math.exp(a[0]); }
    };

    private static final Function LN = new Function("ln", 1) {
        @Override public double apply(double... a) { return Math.log(a[0]); }
    };

    private static final Function LOG10 = new Function("log10", 1) {
        @Override public double apply(double... a) { return Math.log10(a[0]); }
    };

    /** Evalúa una expresión con variables (params), aceptando fracciones tipo "3/10". */
    public static double eval(String expr, Map<String, Object> params) {
        if (expr == null || expr.isBlank()) {
            throw new IllegalArgumentException("Expresión vacía");
        }
        // Preparar builder con funciones y variables
        ExpressionBuilder b = new ExpressionBuilder(expr)
                .functions(NCR, NPR, ERF, PHI, POW, EXP, LN, LOG10);

        // setear variables
        for (String k : params.keySet()) {
            b.variable(k);
        }
        Expression e = b.build();

        for (Map.Entry<String, Object> en : params.entrySet()) {
            e.setVariable(en.getKey(), toDouble(en.getValue()));
        }
        return e.evaluate();
    }

    // --- Helpers ---

    private static double toDouble(Object v) {
        if (v instanceof Number n) return n.doubleValue();
        String s = String.valueOf(v).trim().toLowerCase(Locale.ROOT);
        if (s.contains("/")) {
            String[] t = s.split("/");
            if (t.length == 2) {
                double a = Double.parseDouble(t[0].trim());
                double b = Double.parseDouble(t[1].trim());
                return a / b;
            }
        }
        return Double.parseDouble(s);
    }

    // aproximación numérica de erf(x) (Abramowitz & Stegun 7.1.26)
    private static double erf(double x) {
        double t = 1.0 / (1.0 + 0.5 * Math.abs(x));
        double tau = t * Math.exp(-x*x - 1.26551223 +
                1.00002368 * t +
                0.37409196 * t*t +
                0.09678418 * Math.pow(t,3) -
                0.18628806 * Math.pow(t,4) +
                0.27886807 * Math.pow(t,5) -
                1.13520398 * Math.pow(t,6) +
                1.48851587 * Math.pow(t,7) -
                0.82215223 * Math.pow(t,8) +
                0.17087277 * Math.pow(t,9));
        return x >= 0 ? 1 - tau : tau - 1;
    }
}
