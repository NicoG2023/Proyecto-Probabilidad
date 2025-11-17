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
  status?: 'EN_PROGRESO' | 'PRESENTADO' | 'CANCELADO' | string;
  score?: number | null;
  startedAt?: string | null;
  submittedAt?: string | null;
  quiz?: { corte?: string };
};

export type PreguntaDTO = {
  instanciaId: number;
  enunciado: string;
  opciones: Record<string, string>;
  tipo?: 'MCQ' | 'OPEN_NUM' | 'OPEN_TEXT'; // <-- usa lo que manda el backend
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
    opcionMarcada?: string;     // MCQ
    valorNumero?: number;       // OPEN_NUM
    valorTexto?: string;        // OPEN_TEXT
  }>;
};

export type RetroalimentacionDTO = {
  instanciaId: number;
  enunciado: string;
  opciones: Record<string, string>;
  opcionMarcada: string | null;
  esCorrecta: boolean;
  opcionCorrecta: string | null;   // MCQ; null en abiertas

  // Nuevos (si el backend los envía):
  tipo?: 'MCQ' | 'OPEN_NUM' | 'OPEN_TEXT';
  valorIngresado?: string | null;  // OPEN_TEXT
  numeroIngresado?: number | null; // OPEN_NUM
  valorEsperado?: string | null;   // texto formateado del esperado (OPEN_NUM/TEXT)
};

export const EstudianteAPI = {
  crearIntento: async (corte: Corte) => {
    const res = await http.post<IntentoCreadoDTO>(`/quices/${encodeURIComponent(corte)}/intentos`);
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
    const res = await http.get<IntentoQuiz[]>(`/yo/intentos`, { params: { pagina, tamano } });
    return res.data;
  },

  guardarRespuestas: async (intentoId: number, lote: LoteRespuestasDTO) => {
    await http.post(`/intentos/${intentoId}/respuestas`, lote);
  },

  enviarIntento: async (intentoId: number) => {
    const res = await http.post<ResultadoEnvioDTO>(`/intentos/${intentoId}/enviar`);
    return res.data;
  },

  retroalimentacion: async (intentoId: number) => {
    const res = await http.get<RetroalimentacionDTO[]>(`/intentos/${intentoId}/retroalimentacion`);
    return res.data;
  },
};
