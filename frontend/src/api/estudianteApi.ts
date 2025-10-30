// src/api/estudianteApi.ts
import { http } from './http';

export type Corte = 'C1' | 'C2' | 'C3';

export type IntentoCreadoDTO = {
  intentoId: number;
  quizId: number;
  corte: string;
  iniciadoEn: string;
};

export type IntentoQuiz = {
  id: number;
  score?: number | null;
  startedAt?: string | null;
  submittedAt?: string | null;
  quiz?: { corte?: string };
};

/** === Tipos para ver intento (frontend) === */
export type PreguntaDTO = {
  instanciaId: number;
  enunciado: string;                         // viene de stemMd
  opciones: Record<string, string>;          // { "A": "Opción A", ... }
};

export type IntentoVistaDTO = {
  intentoId: number;
  quizId: number;
  estado: string;                            // p.ej. IN_PROGRESS
  preguntas: PreguntaDTO[];
};

export type EstadisticasYo = {
  intentos: number;
  promedio: number;
  promedioPorCorte: Record<string, number>;
};

export type ResultadoEnvioDTO = {
  intentoId: number;
  estado: string;           // 'PRESENTADO'
  nota: number | null;      // 0–100 (o null)
  totalPreguntas: number;
  correctas: number;
};

export type LoteRespuestasDTO = {
  respuestas: { instanciaId: number; opcionMarcada: string }[];
};

export type RetroalimentacionDTO = {
  instanciaId: number;
  enunciado: string;
  opciones: Record<string, string>;
  opcionMarcada: string | null;
  esCorrecta: boolean;
  opcionCorrecta: string;
};

export const EstudianteAPI = {
  crearIntento: async (corte: Corte) => {
    const res = await http.post<IntentoCreadoDTO>(`/quices/${encodeURIComponent(corte)}/intentos`);
    return res.data;
  },

  /** Lee el intento + preguntas (sin respuestas correctas) */
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

  guardarRespuestas: async (intentoId: number, seleccion: Record<number, string>) => {
    const payload: LoteRespuestasDTO = {
      respuestas: Object.entries(seleccion).map(([instanciaId, opcionMarcada]) => ({
        instanciaId: Number(instanciaId),
        opcionMarcada,
      })),
    };
    await http.post(`/intentos/${intentoId}/respuestas`, payload);
  },

  /** Envía el intento para calificar y retorna el resumen (nota). */
  enviarIntento: async (intentoId: number) => {
    const res = await http.post<ResultadoEnvioDTO>(`/intentos/${intentoId}/enviar`);
    return res.data;
  },

  retroalimentacion: async (intentoId: number) => {
    const res = await http.get<RetroalimentacionDTO[]>(`/intentos/${intentoId}/retroalimentacion`);
    return res.data;
  },
};
