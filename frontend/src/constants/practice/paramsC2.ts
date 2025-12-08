// src/constants/practice/paramsC2.ts
import type { SliderConfig, ParamsState, ParamsValidator } from "./types";

/**
 * Sliders para TODOS los parámetros numéricos que aparecen
 * en las preguntas del Segundo Corte (C2).
 *
 * P1: pdef, n, e, m
 * P2: lambda, t
 * P3: alpha, beta, t
 * P4: c
 */
export const PARAM_SLIDER_CONFIG_C2: Record<string, SliderConfig> = {
  // ---------------------------
  // P1 – Binomial aprox (dos probabilidades)
  // ---------------------------
  pdef: {
    min: 0.06,
    max: 0.14,
    step: 0.005,
    asPercent: true,
    label: "Proporción de defectuosos p",
  },
  n: {
    min: 60,
    max: 140,
    step: 5,
    label: "Tamaño de la muestra n",
  },
  e: {
    min: 4,
    max: 20,
    step: 1,
    label: "Umbral: X > e (defectuosos)",
  },
  m: {
    min: 2,
    max: 15,
    step: 1,
    label: "Umbral: X < m (defectuosos)",
  },

  // ---------------------------
  // P2 – Exponencial CDF
  // ---------------------------
  lambda: {
    min: 0.002,
    max: 0.03,
    step: 0.001,
    label: "Tasa de falla λ (por hora)",
  },
  t: {
    min: 50,
    max: 300,
    step: 10,
    label: "Tiempo t (horas)",
  },

// ---------------------------
// P3 – Weibull supervivencia
// ---------------------------
alpha: {
  min: 0.5,
  max: 2.0,
  step: 0.1,
  label: "Parámetro de forma α",
},
beta: {
  min: 1.0,
  max: 4.0,
  step: 0.1,
  label: "Parámetro de escala β",
},
t_weibull: {
  min: 1,
  max: 10,
  step: 0.5,
  label: "Tiempo t (años)",
},

// ---------------------------
// P4 – Densidad conjunta (k)
// ---------------------------
c: {
  min: 16,
  max: 32,
  step: 1,
  label: "Constante c de la densidad conjunta",
},


};

/**
 * Validaciones para C2.
 * No son ultra estrictas, pero evitan cosas claramente sin sentido
 * (n <= 0, e > n, etc.).
 */
export const validateParamsC2: ParamsValidator = (
  _templateId,
  params: ParamsState
): string | null => {
  const errors: string[] = [];

  // --- P1: Binomial aprox ---
  const hasBinomParams =
    params.pdef !== undefined &&
    params.n !== undefined &&
    params.e !== undefined &&
    params.m !== undefined;

  if (hasBinomParams) {
    const pdef = Number(params.pdef);
    const n = Number(params.n);
    const e = Number(params.e);
    const m = Number(params.m);

    if (!(pdef > 0 && pdef < 1)) {
      errors.push("La proporción de defectuosos p debe estar entre 0 y 1.");
    }
    if (!(n > 0)) {
      errors.push("El tamaño de la muestra n debe ser mayor que 0.");
    }
    if (e < 0 || m < 0) {
      errors.push("Los umbrales e y m deben ser no negativos.");
    }
    if (n > 0 && e >= n) {
      errors.push("El umbral e debe ser menor que n (no puede exceder el tamaño de la muestra).");
    }
    if (n > 0 && m > n) {
      errors.push("El umbral m no puede ser mayor que n.");
    }
  }

  // --- P2: Exponencial CDF ---
  const hasExpParams =
    params.lambda !== undefined &&
    params.t !== undefined &&
    (params.alpha === undefined || params.beta === undefined); // heurística para no confundir con Weibull

  if (hasExpParams) {
    const lambda = Number(params.lambda);
    const t = Number(params.t);

    if (!(lambda > 0)) {
      errors.push("La tasa de falla λ debe ser positiva.");
    }
    if (t < 0) {
      errors.push("El tiempo t en la exponencial no puede ser negativo.");
    }
  }

  // --- P3: Weibull ---
  const hasWeibullParams =
    params.alpha !== undefined &&
    params.beta !== undefined &&
    params.t_weibull !== undefined;

  if (hasWeibullParams) {
    const alpha = Number(params.alpha);
    const beta = Number(params.beta);
    const tWeibull = Number(params.t_weibull);

    if (!(alpha > 0)) {
      errors.push("El parámetro de forma α debe ser positivo.");
    }
    if (!(beta > 0)) {
      errors.push("El parámetro de escala β debe ser positivo.");
    }
    if (tWeibull < 0) {
      errors.push("El tiempo t en la Weibull no puede ser negativo.");
    }
  }

  // --- P4: Densidad conjunta (k) ---
  if (params.c !== undefined) {
    const c = Number(params.c);
    if (!(c > 0)) {
      errors.push("La constante c de la densidad conjunta debe ser positiva.");
    }
  }

  if (errors.length > 0) {
    return errors.join(" ");
  }

  return null;
};

// src/constants/practice/paramsC2.ts

export const PLACEHOLDER_EXPR_C2: Record<number, string> = {
  // P1 – Binomial → normal con dos probabilidades (par numérico)
  // (usa mcq_auto_pair, se responde como "0.123, 0.456", así que
  //   realmente no se usa MathExpressionInput y este placeholder no es necesario)

  // P2 – Exponencial CDF  P(T < t)
  6: String.raw`
P(T<t)=1-e^{-\lambda t}
`,

  // P3 – Weibull, prob. de seguir en operación (supervivencia)
  7: String.raw`
P(T>t)=S(t)=e^{-\left(\tfrac{t}{\beta}\right)^{\alpha}}
`,

  // P4 – Densidad de Z = X+Y, constante k
  8: String.raw`
h(z)=k z^{3},\;0<z<1,\quad k=\dfrac{c}{12}
`,
};

