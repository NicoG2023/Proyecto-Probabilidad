// src/api/profesorApi.ts
import { http } from "./http";

/* ===== Tipos compartidos ===== */

export type Corte = "C1" | "C2" | "C3A" | "C3B";
export type EstadoIntento = "EN_PROGRESO" | "PRESENTADO" | "CANCELADO";

/** DTO: resumen por alumno (para tabla principal) */
export interface StudentSummaryDto {
  id: number;
  username: string | null;
  email: string | null;
  attemptsCount: number;
  lastAttemptAt: string | null;
  avgScore: number | null;
}

/** DTO: intentos de un alumno concreto */
export interface StudentQuizAttemptDto {
  attemptId: number;
  quizId: number;
  quizTitle: string;
  corte: Corte;
  startedAt: string | null;
  submittedAt: string | null;
  status: EstadoIntento;
  maxPoints: number | null;
  scorePoints: number | null;
  score: number | null;
}

/** DTO: gráfica top estudiantes por cantidad de quices realizados */
export interface StudentAttemptsChartDto {
  studentId: number;
  username: string | null;
  attemptsCount: number;
}

/** DTO: gráfica top estudiantes por quices aprobados */
export interface StudentPassedChartDto {
  studentId: number;
  username: string | null;
  passedCount: number;
}

export const ProfesorAPI = {
  /** Lista de alumnos con al menos un intento de quiz */
  async listarAlumnos(): Promise<StudentSummaryDto[]> {
    const res = await http.get<StudentSummaryDto[]>("/teacher/students");
    return res.data;
  },

  /** Intentos de quiz de un alumno concreto */
  async intentosDeAlumno(
    studentId: number
  ): Promise<StudentQuizAttemptDto[]> {
    const res = await http.get<StudentQuizAttemptDto[]>(
      `/teacher/students/${studentId}/attempts`
    );
    return res.data;
  },

  /** Top N estudiantes por cantidad de intentos realizados */
  async topPorIntentos(limit = 10): Promise<StudentAttemptsChartDto[]> {
    const res = await http.get<StudentAttemptsChartDto[]>(
      "/teacher/stats/top-attempts",
      { params: { limit } }
    );
    return res.data;
  },

  /** Top N estudiantes por quices aprobados (score >= minScore) */
  async topPorAprobados(
    minScore = 60,
    limit = 5
  ): Promise<StudentPassedChartDto[]> {
    const res = await http.get<StudentPassedChartDto[]>(
      "/teacher/stats/top-passed",
      {
        params: { minScore, limit },
      }
    );
    return res.data;
  },
};
