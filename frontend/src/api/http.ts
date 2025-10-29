// src/api/http.ts
import axios, { AxiosError } from 'axios';
import { keycloak } from '../auth/keycloak';

// Usa VITE_API_BASE (p.ej. "/api") o cae en "/api" por defecto
const baseURL = (import.meta.env.VITE_API_BASE as string) || '/api';

export const http = axios.create({
  baseURL,
  // withCredentials: true, // solo si tu backend lo requiere
  headers: {
    'Content-Type': 'application/json',
  },
});

// -------- Request: adjunta el Bearer token ----------
http.interceptors.request.use(async (config) => {
  if (keycloak.authenticated) {
    try {
      await keycloak.updateToken(60);
    } catch {
      // si falla el refresh puedes forzar login, si quieres:
      // keycloak.login();
    }
    if (keycloak.token) {
      config.headers = config.headers ?? {};
      (config.headers as any).Authorization = `Bearer ${keycloak.token}`;
    }
  }
  return config;
});

// -------- Response: normaliza errores legibles ----------
http.interceptors.response.use(
  (res) => res, // deja la respuesta tal cual (usaremos res.data en las APIs)
  async (err: AxiosError) => {
    // Si hay respuesta del server, arma un mensaje claro
    if (err.response) {
      const status = err.response.status;
      const statusText = err.response.statusText || '';
      const data = err.response.data as any;

      let detail = '';
      if (typeof data === 'string') {
        detail = data;                   // HTML o texto plano (típico 404 de Vite)
      } else if (data && typeof data === 'object') {
        // intenta usar mensaje del backend si existe
        detail =
          data.message ||
          data.error ||
          data.title ||
          JSON.stringify(data);
      }

      return Promise.reject(
        new Error(`HTTP ${status} ${statusText}${detail ? ` — ${detail}` : ''}`)
      );
    }

    // sin respuesta (network error, CORS, etc.)
    return Promise.reject(err);
  }
);
