// src/constants/practice/paramsC1.ts
import type { SliderConfig, ParamsState, ParamsValidator } from "./types";

// Sliders para TODAS las preguntas del Corte 1
export const PARAM_SLIDER_CONFIG_C1: Record<string, SliderConfig> = {
  // P1 – Multinomial contagios
  p_covid: {
    min: 0.2,
    max: 0.35,
    step: 0.01,
    asPercent: true,
    label: "Prob. contagio Covid-19",
  },
  p_omicron: {
    min: 0.25,
    max: 0.4,
    step: 0.01,
    asPercent: true,
    label: "Prob. contagio Omicron",
  },
  p_n1h1: {
    min: 0.3,
    max: 0.45,
    step: 0.01,
    asPercent: true,
    label: "Prob. contagio N1H1",
  },
  x_covid: {
    min: 0,
    max: 5,
    step: 1,
    label: "Contagiados Covid-19",
  },
  x_omicron: {
    min: 0,
    max: 5,
    step: 1,
    label: "Contagiados Omicron",
  },
  x_n1h1: {
    min: 0,
    max: 5,
    step: 1,
    label: "Contagiados N1H1",
  },

  // P2 – Combinatoria por grupos
  jovenes_tot: {
    min: 1,
    max: 10,
    step: 1,
    label: "Total de Jóvenes",
  },
  mayores_tot: {
    min: 1,
    max: 10,
    step: 1,
    label: "Total de Mayores",
  },
  ninos_tot: {
    min: 1,
    max: 10,
    step: 1,
    label: "Total de Niños",
  },
  x_jov: {
    min: 1,
    max: 10,
    step: 1,
    label: "Jóvenes que se contagian",
  },
  x_may: {
    min: 1,
    max: 10,
    step: 1,
    label: "Mayores que se contagian",
  },
  x_nino: {
    min: 1,
    max: 10,
    step: 1,
    label: "Niños que se contagian",
  },

  // P3 – Serie 3 de 4
  gana: {
    min: 1,
    max: 4,
    step: 1,
    label: "Juegos que debe ganar A",
  },
  total: {
    min: 1,
    max: 7,
    step: 1,
    label: "Número total de juegos",
  },
  pA: {
    min: 0.5,
    max: 0.7,
    step: 0.01,
    asPercent: true,
    label: "Prob. de victoria de A",
  },

  // P4 – Poisson aprox
  m: {
    min: 1000,
    max: 20000,
    step: 500,
    label: "Media diaria de clientes m",
  },
  pmin: {
    min: 0.0001,
    max: 0.0003,
    step: 0.00001,
    label: "Prob. por cliente-minuto p_min",
  },
  t: {
    min: 1,
    max: 10,
    step: 1,
    label: "Tiempo (minutos) t",
  },
};

// Validaciones para Corte 1
export const validateParamsC1: ParamsValidator = (
  _templateId,
  params: ParamsState
): string | null => {
  // --- Regla multinomial P1: p_covid + p_omicron + p_n1h1 = 1 ---
  const hasMultParams =
    params.p_covid !== undefined &&
    params.p_omicron !== undefined &&
    params.p_n1h1 !== undefined;

  if (hasMultParams) {
    const p1 = Number(params.p_covid ?? 0);
    const p2 = Number(params.p_omicron ?? 0);
    const p3 = Number(params.p_n1h1 ?? 0);
    const sum = p1 + p2 + p3;
    if (Math.abs(sum - 1) > 1e-6) {
      return "Las probabilidades p_covid, p_omicron y p_n1h1 deben sumar 100 %.";
    }
  }

  // --- Regla combinatoria P2: x_* <= *_tot ---
  const errors: string[] = [];

  const pairs: Array<{
    xKey: keyof ParamsState;
    totKey: keyof ParamsState;
    label: string;
  }> = [
    { xKey: "x_jov", totKey: "jovenes_tot", label: "jóvenes" },
    { xKey: "x_may", totKey: "mayores_tot", label: "mayores" },
    { xKey: "x_nino", totKey: "ninos_tot", label: "niños" },
  ];

  for (const { xKey, totKey, label } of pairs) {
    if (params[xKey] !== undefined && params[totKey] !== undefined) {
      const xVal = Number(params[xKey]);
      const totVal = Number(params[totKey]);
      if (xVal > totVal) {
        errors.push(
          `No pueden contagiarse más ${label} de los que ingresan ( ${String(
            xKey
          )} > ${String(totKey)} ).`
        );
      }
    }
  }

  if (errors.length > 0) {
    return errors.join(" ");
  }

  return null;
};

// src/constants/practice/paramsC1.ts

export const PLACEHOLDER_EXPR_C1: Record<number, string> = {
  // P1 – Multinomial (3 categorías)
  1: String.raw`
P(X_1=x_1,X_2=x_2,X_3=x_3)
= \dfrac{n!}{x_1!x_2!x_3!}\,p_1^{x_1}p_2^{x_2}p_3^{x_3}
`,

  // P2 es texto abierto (“Ninguna de las anteriores”), no usamos MathExpressionInput,
  // así que no hace falta placeholder.

  // P3 – Serie 3 de 4 (Santafé gana la serie)
  3: String.raw`
P(B)=\binom{4}{3}(1-p_A)^3\,p_A+\binom{4}{4}(1-p_A)^4
`,

  // P4 – Poisson aprox. “más de 1”
  4: String.raw`
P(N>1)=1-e^{-\lambda}(1+\lambda),
\quad \lambda = m\,p\,t
`,
};

