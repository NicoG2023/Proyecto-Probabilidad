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

export type EstadisticasYo = {
  intentos: number;
  promedio: number;
  promedioPorCorte: Record<string, number>;
};

export const EstudianteAPI = {
  crearIntento: async (corte: Corte) => {
    const res = await http.post<IntentoCreadoDTO>(`/quices/${encodeURIComponent(corte)}/intentos`);
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
};
