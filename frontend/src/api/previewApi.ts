// src/api/previewApi.ts
import { http } from "./http";

export interface PreviewPreguntaDto {
  instanciaId: number;
  enunciado: string;

  // Para MCQ; para abiertas puede venir vacío
  opciones?: Record<string, string>;

  tipo: "MCQ" | "OPEN_NUM" | "OPEN_TEXT";

  // MCQ
  opcionMarcada?: string | null;
  opcionCorrecta?: string | null;

  // OPEN_TEXT
  valorIngresado?: string | null;
  valorEsperado?: string | null;

  // OPEN_NUM
  numeroIngresado?: number | null;
  numeroEsperado?: number | null;

  esCorrecta: boolean;
}

export interface PreviewQuizDto {
  intentoId: number;
  quizId: number;
  quizTitulo: string;

  estudianteUsername?: string | null;
  estudianteEmail?: string | null;

  estado: string;      // PRESENTADO, etc.
  nota: string | number | null; // BigDecimal serializado -> suele llegar como number

  preguntas: PreviewPreguntaDto[];
}

export const PreviewAPI = {
  async verIntento(intentoId: number): Promise<PreviewQuizDto> {
    const res = await http.get(`/preview/intentos/${intentoId}`);
    return res.data;
  },
};
