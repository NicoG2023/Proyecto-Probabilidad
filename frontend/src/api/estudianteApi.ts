// src/api/estudianteApi.ts
import { http } from "./http";

export type Corte = "C1" | "C2" | "C3";

/* ======================== EXISTENTES ======================== */

export type IntentoCreadoDTO = {
  intentoId: number;
  quizId: number;
  corte: string;
  iniciadoEn: string;
};

export type IntentoQuiz = {
  id: number;
  status?: "EN_PROGRESO" | "PRESENTADO" | "CANCELADO" | string;
  score?: number | null;
  startedAt?: string | null;
  submittedAt?: string | null;
  quiz?: { corte?: string };
};

export type PreguntaDTO = {
  instanciaId: number;
  enunciado: string;
  opciones: Record<string, string>;
  tipo?: "MCQ" | "OPEN_NUM" | "OPEN_TEXT";
};

export type IntentoVistaDTO = {
  intentoId: number;
  quizId: number;
  estado: string;
  preguntas: PreguntaDTO[];
};

export type EstadisticasYo = {
  intentos: number;
  promedio: number;
  promedioPorCorte: Record<string, number>;
};

export type ResultadoEnvioDTO = {
  intentoId: number;
  estado: string;
  nota: number | null;
  totalPreguntas: number;
  correctas: number;
};

export type LoteRespuestasDTO = {
  respuestas: Array<{
    instanciaId: number;
    opcionMarcada?: string; // MCQ
    valorNumero?: number; // OPEN_NUM
    valorTexto?: string; // OPEN_TEXT
  }>;
};

export type RetroalimentacionDTO = {
  instanciaId: number;
  enunciado: string;
  opciones: Record<string, string>;
  opcionMarcada: string | null;
  esCorrecta: boolean;
  opcionCorrecta: string | null;

  tipo?: "MCQ" | "OPEN_NUM" | "OPEN_TEXT";
  valorIngresado?: string | null;
  numeroIngresado?: number | null;
  valorEsperado?: string | null;
};

/* ======================== NUEVOS: PRÁCTICA ======================== */

// Lo que devuelve el backend dentro de PracticeQuestionDto.answerMeta
export type PracticeAnswerMeta = {
  // modo general
  mode: "mcq_auto" | "open_numeric" | "mcq_auto_pair" | "open_text";

  // ===== numérico simple (mcq_auto / open_numeric) =====
  value?: number;
  tolAbs?: number;
  tolPct?: number;
  format?: string; // 'number' | 'fraction' | 'percent' | 'latex' | ...
  decimals?: number;
  maxDenominator?: number;
  display?: string;

  // ===== par numérico (mcq_auto_pair) =====
  leftValue?: number;
  rightValue?: number;

  leftTolAbs?: number;
  rightTolAbs?: number;

  leftTolPct?: number;
  rightTolPct?: number;

  leftFormat?: string;
  rightFormat?: string;

  leftDecimals?: number;
  rightDecimals?: number;

  leftMaxDenominator?: number;
  rightMaxDenominator?: number;

  leftDisplay?: string;
  rightDisplay?: string;

  sep?: string; // separador usado en display, ej. " , " o " y "

  // ===== texto (open_text) =====
  textFormat?: string; // 'latex' | 'plain'
  canonical?: string;
  accept?: string[];
  regex?: string[];
  caseSensitive?: boolean;
  trim?: boolean;
  latexPreview?: string; // para mostrar en el front
};

// Lo que devuelve /practice/render
export type PracticeQuestionDTO = {
  templateId: number;
  stemMd: string; // enunciado en markdown/LaTeX
  params: Record<string, any>; // parámetros normalizados que usó el backend
  explanationMd?: string | null;
  answerMeta?: PracticeAnswerMeta | null;
};

// Lo que devuelve /practice/check
export type PracticeCheckResultDTO = {
  isCorrect: boolean;
  correctDisplay?: string | null; // respuesta correcta formateada
  explanationMd?: string | null; // explicación interpolada para esos params
};

export const EstudianteAPI = {
  /* ===== modo examen (ya existentes) ===== */

  crearIntento: async (corte: Corte) => {
    const res = await http.post<IntentoCreadoDTO>(
      `/quices/${encodeURIComponent(corte)}/intentos`
    );
    return res.data;
  },

  verIntento: async (intentoId: number) => {
    const res = await http.get<IntentoVistaDTO>(`/intentos/${intentoId}`);
    return res.data;
  },

  estadisticas: async () => {
    const res = await http.get<EstadisticasYo>(`/yo/estadisticas`);
    return res.data;
  },

  ultimosIntentos: async (pagina = 0, tamano = 10) => {
    const res = await http.get<IntentoQuiz[]>(`/yo/intentos`, {
      params: { pagina, tamano },
    });
    return res.data;
  },

  guardarRespuestas: async (intentoId: number, lote: LoteRespuestasDTO) => {
    await http.post(`/intentos/${intentoId}/respuestas`, lote);
  },

  enviarIntento: async (intentoId: number) => {
    const res = await http.post<ResultadoEnvioDTO>(
      `/intentos/${intentoId}/enviar`
    );
    return res.data;
  },

  retroalimentacion: async (intentoId: number) => {
    const res = await http.get<RetroalimentacionDTO[]>(
      `/intentos/${intentoId}/retroalimentacion`
    );
    return res.data;
  },

  /**
   * Genera una pregunta de práctica a partir de un template y un conjunto de parámetros.
   * Los params pueden venir de sliders, selects, etc.
   */
  renderPractica: async (templateId: number, params: Record<string, any>) => {
    const res = await http.post<PracticeQuestionDTO>(`/practice/render`, {
      templateId,
      params,
    });
    return res.data;
  },

  /**
   * Verifica la respuesta del estudiante en modo práctica.
   * Ahora la respuesta se interpreta como una EXPRESIÓN (p.ej. LaTeX),
   * no solo como un número. El backend la evaluará simbólicamente.
   *
   * Debes mandar EXACTAMENTE los mismos params que usaste en renderPractica.
   */
  checkPractica: async (
    templateId: number,
    params: Record<string, any>,
    expression: string // expresión escrita por el estudiante (Latex / fórmula)
  ) => {
    console.log("expresión enviada al backend: ", expression);
    const res = await http.post<PracticeCheckResultDTO>(`/practice/check`, {
      templateId,
      params,
      expression, // <-- clave que debe leer el backend
    });
    return res.data;
  },
};
