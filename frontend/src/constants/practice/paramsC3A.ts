// src/constants/practice/paramsC3A.ts
import type { SliderConfig, ParamsState, ParamsValidator } from "./types";

/**
 * Sliders para TODOS los parámetros numéricos
 * que aparecen en las preguntas del Tercer Corte – Primer Modelo (C3A).
 *
 * P1: mu, sigma, centro, tol
 * P2: K, D, n
 * P3: p1, c1, p2, c2
 * P4: coef_ingreso, coef_costo
 * P5: c
 */
export const PARAM_SLIDER_CONFIG_C3A: Record<string, SliderConfig> = {
  // ---------------------------
  // P1 – Normal: proporción dentro de tolerancia
  // ---------------------------
  mu: {
    min: 2.49,
    max: 2.51,
    step: 0.001,
    label: "Media μ (cm)",
  },
  sigma: {
    min: 0.002,
    max: 0.010,
    step: 0.0005,
    label: "Desviación estándar σ (cm)",
  },
  centro: {
    min: 2.48,
    max: 2.52,
    step: 0.005,
    label: "Centro de especificación (cm)",
  },
  tol: {
    min: 0.005,
    max: 0.020,
    step: 0.001,
    label: "Tolerancia ± (cm)",
  },

  // ---------------------------
  // P2 – Hipergeométrica: media y varianza
  // ---------------------------
  K: {
    min: 2,
    max: 20,
    step: 1,
    label: "Componentes buenos K",
  },
  D: {
    min: 1,
    max: 20,
    step: 1,
    label: "Componentes defectuosos D",
  },
  n: {
    min: 1,
    max: 20,
    step: 1,
    label: "Tamaño de muestra n",
  },

  // ---------------------------
  // P3 – Valor esperado de comisiones
  // ---------------------------
  p1: {
    min: 0.20,
    max: 0.80,
    step: 0.01,
    asPercent: true,
    label: "Probabilidad de éxito cliente 1 (p₁)",
  },
  c1: {
    min: 0.50,
    max: 3.00,
    step: 0.05,
    label: "Comisión cliente 1 (millones)",
  },
  p2: {
    min: 0.20,
    max: 0.80,
    step: 0.01,
    asPercent: true,
    label: "Probabilidad de éxito cliente 2 (p₂)",
  },
  c2: {
    min: 0.50,
    max: 3.00,
    step: 0.05,
    label: "Comisión cliente 2 (millones)",
  },

  // ---------------------------
  // P4 – Máxima utilidad cuadrática
  // ---------------------------
  coef_ingreso: {
    min: 10,
    max: 60,
    step: 2,
    label: "Coeficiente de ingreso a",
  },
  coef_costo: {
    min: 1,
    max: 10,
    step: 1,
    label: "Coeficiente de costo b",
  },

  // ---------------------------
  // P5 – Transformación Y = c X^3
  // ---------------------------
  c: {
    min: 1,
    max: 6,
    step: 0.5,
    label: "Constante c en Y = c X³",
  },
};

/**
 * Validaciones para C3A.
 * Son suaves, pero evitan parámetros sin sentido:
 *  - σ > 0, tol > 0
 *  - N = K + D >= 1, 0 ≤ n ≤ N
 *  - 0 < p1,p2 < 1, c1,c2 > 0
 *  - coef_ingreso, coef_costo > 0
 *  - c > 0
 */
export const validateParamsC3A: ParamsValidator = (
  _templateId,
  params: ParamsState
): string | null => {
  const errors: string[] = [];

  // --- P1: Normal (esferas dentro de tolerancia) ---
  const hasNormalParams =
    params.mu !== undefined &&
    params.sigma !== undefined &&
    params.centro !== undefined &&
    params.tol !== undefined;

  if (hasNormalParams) {
    const mu = Number(params.mu);
    const sigma = Number(params.sigma);
    const centro = Number(params.centro);
    const tol = Number(params.tol);

    if (!(sigma > 0)) {
      errors.push("La desviación estándar σ debe ser positiva.");
    }
    if (!(tol > 0)) {
      errors.push("La tolerancia debe ser positiva.");
    }
    if (centro <= 0) {
      errors.push("El centro de especificación debe ser positivo.");
    }
    if (tol >= centro) {
      errors.push("La tolerancia no puede ser mayor o igual al valor central.");
    }
    if (mu <= 0) {
      errors.push("La media μ debe ser positiva.");
    }
  }

  // --- P2: Hipergeométrica (media y varianza) ---
  const hasHyperParams =
    params.K !== undefined &&
    params.D !== undefined &&
    params.n !== undefined;

  if (hasHyperParams) {
    const K = Number(params.K);
    const D = Number(params.D);
    const n = Number(params.n);
    const N = K + D;

    if (!(K >= 0)) {
      errors.push("El número de buenos K no puede ser negativo.");
    }
    if (!(D >= 0)) {
      errors.push("El número de defectuosos D no puede ser negativo.");
    }
    if (!(N > 0)) {
      errors.push("La población total N = K + D debe ser positiva.");
    }
    if (!(n >= 0)) {
      errors.push("El tamaño de muestra n no puede ser negativo.");
    }
    if (n > N) {
      errors.push("El tamaño de muestra n no puede ser mayor que N = K + D.");
    }
  }

  // --- P3: Valor esperado de comisiones ---
  const hasComisionParams =
    params.p1 !== undefined &&
    params.c1 !== undefined &&
    params.p2 !== undefined &&
    params.c2 !== undefined;

  if (hasComisionParams) {
    const p1 = Number(params.p1);
    const c1 = Number(params.c1);
    const p2 = Number(params.p2);
    const c2 = Number(params.c2);

    if (!(p1 > 0 && p1 < 1)) {
      errors.push("La probabilidad p₁ debe estar entre 0 y 1.");
    }
    if (!(p2 > 0 && p2 < 1)) {
      errors.push("La probabilidad p₂ debe estar entre 0 y 1.");
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
    params.coef_ingreso !== undefined &&
    params.coef_costo !== undefined;

  if (hasUtilidadParams) {
    const a = Number(params.coef_ingreso);
    const b = Number(params.coef_costo);

    if (!(a > 0)) {
      errors.push("El coeficiente de ingreso a debe ser positivo.");
    }
    if (!(b > 0)) {
      errors.push("El coeficiente de costo b debe ser positivo.");
    }
  }

  // --- P5: Transformación Y = c X^3 ---
  if (params.c !== undefined) {
    const c = Number(params.c);
    if (!(c > 0)) {
      errors.push("La constante c en Y = c X³ debe ser positiva.");
    }
  }

  if (errors.length > 0) {
    return errors.join(" ");
  }
  return null;
};

// Sugerencias de expresión por etiqueta de pregunta (se usan en la práctica)
export const PLACEHOLDER_EXPR_C3A: Record<number, string> = {
  // Ajusta las keys a los `label` que tengas en PRACTICE_TEMPLATES[C3A]
  9: String.raw`P(a<X<b)=\Phi\!\left(\frac{b-\mu}{\sigma}\right)-\Phi\!\left(\frac{a-\mu}{\sigma}\right)`,

  10: String.raw`\mu=E[X]=n\frac{K}{K+D},\; \sigma^2=Var(X)=n\frac{K}{K+D}\left(1-\frac{K}{K+D}\right)\frac{K+D-n}{K+D-1}`,

  11: String.raw`E[\text{ganancia}]=p_1c_1+p_2c_2`,

  12: String.raw`\mu^*=\frac{a}{2b},\; U_{\max}=\frac{a^2}{4b}`,

  13: String.raw`f(y)=\frac{2}{3\,c^{2/3}y^{1/3}},\;0<y<c`,
};

