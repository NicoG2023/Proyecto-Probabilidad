// src/constants/practiceTemplates.ts
export type PracticeCorte = "C1" | "C2" | "C3A" | "C3B";

export const PRACTICE_TEMPLATES: Record<
  PracticeCorte,
  { id: number; label: string }[]
> = {
  C1: [
    { id: 1, label: "Multinomial contagios" },
    { id: 2, label: "Intervalo de confianza" },
    { id: 3, label: "Aproximación normal" },
    { id: 4, label: "Otra cosa C1" },
  ],
  C2: [
    { id: 5, label: "Binomial → Normal" },
    { id: 6, label: "Exponencial CDF" },
    { id: 7, label: "Weibull supervivencia" },
    { id: 8, label: "Densidad conjunta chocolates" },
  ],
  C3A: [
    { id: 9, label: "Normal tolerancias (C3A)" },
    { id: 10, label: "Hipergeométrica (C3A)" },
    { id: 11, label: "Valor esperado comisiones (C3A)" },
    { id: 12, label: "U_max dron (C3A)" },
    { id: 13, label: "Transformación Y = cX^3 (C3A)" },
  ],
  C3B: [
    { id: 14, label: "Normal intervalo (C3B)" },
    { id: 15, label: "Discreta 0,1,2 resistores (C3B)" },
    { id: 16, label: "Valor esperado comisiones (C3B)" },
    { id: 17, label: "U_max dron (C3B)" },
    { id: 18, label: "Transformación Y = cX^2 (C3B)" },
  ],
};
