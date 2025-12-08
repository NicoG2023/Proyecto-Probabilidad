// src/constants/practice/paramsC3B.ts
import type { SliderConfig, ParamsState, ParamsValidator } from "./types";

/**
 * Sliders para TODOS los parámetros numéricos
 * que aparecen en las preguntas del Tercer Corte – Segundo Modelo (C3B).
 *
 * P1: mu, sigma, a, b
 * P2: r_min, r_max, p0_pct, p1_pct, p2_pct
 * P3: p1_pct, p2_pct, c1_mill, c2_mill
 * P4: income_rate, cost_rate
 * P5: c
 */
export const PARAM_SLIDER_CONFIG_C3B: Record<string, SliderConfig> = {
  // ---------------------------
  // P1 – Normal: probabilidad en un intervalo (a, b)
  // ---------------------------
  mu: {
    min: 40,
    max: 60,
    step: 0.5,
    label: "Media μ (horas)",
  },
  sigma: {
    min: 1,
    max: 10,
    step: 0.5,
    label: "Desviación estándar σ (horas)",
  },
  a: {
    min: 30,
    max: 55,
    step: 0.5,
    label: "Límite inferior a (horas)",
  },
  b: {
    min: 45,
    max: 70,
    step: 0.5,
    label: "Límite superior b (horas)",
  },

  // ---------------------------
  // P2 – Discreta {0,1,2}: media y varianza
  // ---------------------------
  r_min: {
    min: 90,
    max: 105,
    step: 1,
    label: "Resistencia mínima esperada (ohmios)",
  },
  r_max: {
    min: 95,
    max: 110,
    step: 1,
    label: "Resistencia máxima esperada (ohmios)",
  },
  // Estos parámetros son porcentajes (0–100), NO probabilidades 0–1
  p0_pct: {
    min: 0,
    max: 100,
    step: 1,
    label: "Probabilidad de 0 resistores que cumplen (p₀, en %)",
  },
  p1_pct: {
    min: 0,
    max: 100,
    step: 1,
    label: "Probabilidad de 1 resistor que cumple (p₁, en %)",
  },
  p2_pct: {
    min: 0,
    max: 100,
    step: 1,
    label: "Probabilidad de 2 resistores que cumplen (p₂, en %)",
  },

  // ---------------------------
  // P3 – Valor esperado de comisiones (en millones)
  // ---------------------------
  // También son porcentajes 0–100
  p1_pct_c3b: {
    min: 0,
    max: 100,
    step: 1,
    label: "Probabilidad de éxito cliente 1 (p₁, en %)",
  },
  p2_pct_c3b: {
    min: 0,
    max: 100,
    step: 1,
    label: "Probabilidad de éxito cliente 2 (p₂, en %)",
  },
  c1_mill: {
    min: 0.5,
    max: 3.0,
    step: 0.05,
    label: "Comisión cliente 1 (millones)",
  },
  c2_mill: {
    min: 0.5,
    max: 3.0,
    step: 0.05,
    label: "Comisión cliente 2 (millones)",
  },

  // ---------------------------
  // P4 – Máxima utilidad cuadrática
  // ---------------------------
  income_rate: {
    min: 5,
    max: 60,
    step: 1,
    label: "Tasa de ingreso (coeficiente de μ)",
  },
  cost_rate: {
    min: 0.5,
    max: 10,
    step: 0.5,
    label: "Tasa de costo (coeficiente de μ²)",
  },

  // ---------------------------
  // P5 – Transformación Y = c X²
  // ---------------------------
  c: {
    min: 1,
    max: 6,
    step: 0.5,
    label: "Constante c en Y = c X²",
  },
};

/**
 * Validaciones para C3B.
 * Son suaves, pero evitan parámetros sin sentido:
 *  - σ > 0, a < b
 *  - r_min < r_max
 *  - 0 ≤ p0_pct,p1_pct,p2_pct ≤ 100 y suman 100
 *  - 0 ≤ p1_pct_c3b,p2_pct_c3b ≤ 100, comisiones > 0
 *  - income_rate, cost_rate > 0
 *  - c > 0
 */
export const validateParamsC3B: ParamsValidator = (
  _templateId,
  params: ParamsState
): string | null => {
  const errors: string[] = [];

  // --- P1: Normal (probabilidad en intervalo [a, b]) ---
  const hasNormalParams =
    params.mu !== undefined &&
    params.sigma !== undefined &&
    params.a !== undefined &&
    params.b !== undefined;

  if (hasNormalParams) {
    const mu = Number(params.mu);
    const sigma = Number(params.sigma);
    const a = Number(params.a);
    const b = Number(params.b);

    if (!(sigma > 0)) {
      errors.push("La desviación estándar σ debe ser positiva.");
    }
    if (!(a < b)) {
      errors.push("Debe cumplirse a < b en el intervalo (a, b).");
    }
    if (a < 0 || b < 0) {
      errors.push("Los límites del intervalo deben ser no negativos.");
    }
    if (mu <= 0) {
      errors.push("La media μ debe ser positiva.");
    }
  }

  // --- P2: Discreta {0,1,2} (media y varianza) ---
  const hasDiscretaParams =
    params.r_min !== undefined &&
    params.r_max !== undefined &&
    params.p0_pct !== undefined &&
    params.p1_pct !== undefined &&
    params.p2_pct !== undefined;

  if (hasDiscretaParams) {
    const rMin = Number(params.r_min);
    const rMax = Number(params.r_max);
    const p0 = Number(params.p0_pct);
    const p1 = Number(params.p1_pct);
    const p2 = Number(params.p2_pct);

    if (!(rMin > 0)) {
      errors.push("La resistencia mínima debe ser positiva.");
    }
    if (!(rMax > 0)) {
      errors.push("La resistencia máxima debe ser positiva.");
    }
    if (!(rMin < rMax)) {
      errors.push("Debe cumplirse r_min < r_max.");
    }

    if (p0 < 0 || p0 > 100) {
      errors.push("p₀ (en %) debe estar entre 0 y 100.");
    }
    if (p1 < 0 || p1 > 100) {
      errors.push("p₁ (en %) debe estar entre 0 y 100.");
    }
    if (p2 < 0 || p2 > 100) {
      errors.push("p₂ (en %) debe estar entre 0 y 100.");
    }

    const sumPct = p0 + p1 + p2;
    if (Math.abs(sumPct - 100) > 1e-6) {
      errors.push("Las probabilidades p₀, p₁ y p₂ (en %) deben sumar 100.");
    }
  }

  // --- P3: Valor esperado de comisiones ---
  const hasComisionParams =
    params.p1_pct_c3b !== undefined &&
    params.p2_pct_c3b !== undefined &&
    params.c1_mill !== undefined &&
    params.c2_mill !== undefined;

  if (hasComisionParams) {
    const p1pct = Number(params.p1_pct_c3b);
    const p2pct = Number(params.p2_pct_c3b);
    const c1 = Number(params.c1_mill);
    const c2 = Number(params.c2_mill);

    if (p1pct < 0 || p1pct > 100) {
      errors.push("La probabilidad p₁ (en %) debe estar entre 0 y 100.");
    }
    if (p2pct < 0 || p2pct > 100) {
      errors.push("La probabilidad p₂ (en %) debe estar entre 0 y 100.");
    }
    if (!(c1 > 0)) {
      errors.push("La comisión del cliente 1 debe ser positiva.");
    }
    if (!(c2 > 0)) {
      errors.push("La comisión del cliente 2 debe ser positiva.");
    }
  }

  // --- P4: Máxima utilidad cuadrática ---
  const hasUtilidadParams =
    params.income_rate !== undefined &&
    params.cost_rate !== undefined;

  if (hasUtilidadParams) {
    const income = Number(params.income_rate);
    const cost = Number(params.cost_rate);

    if (!(income > 0)) {
      errors.push("La tasa de ingreso debe ser positiva.");
    }
    if (!(cost > 0)) {
      errors.push("La tasa de costo debe ser positiva.");
    }
  }

  // --- P5: Transformación Y = c X² ---
  if (params.c !== undefined) {
    const c = Number(params.c);
    if (!(c > 0)) {
      errors.push("La constante c en Y = c X² debe ser positiva.");
    }
  }

  if (errors.length > 0) {
    return errors.join(" ");
  }
  return null;
};

// Sugerencias de expresión por etiqueta de pregunta (C3B)
export const PLACEHOLDER_EXPR_C3B: Record<number, string> = {
  14: String.raw`P(a<X<b)=\Phi\!\left(\frac{b-\mu}{\sigma}\right)-\Phi\!\left(\frac{a-\mu}{\sigma}\right)`,

  15: String.raw`P(X<t)=\Phi\!\left(\frac{t-\mu}{\sigma}\right)`,

  16: String.raw`E[X]=0\cdot p_0+1\cdot p_1+2\cdot p_2,\; Var(X)=E[X^2]-E[X]^2`,

  17: String.raw`E[\text{ganancia}]=\frac{p_1}{100}c_1+\frac{p_2}{100}c_2`,

  18: String.raw`f(y)=\frac{1}{\sqrt{c}\sqrt{y}}-\frac{1}{c},\;0<y<c`,
};


