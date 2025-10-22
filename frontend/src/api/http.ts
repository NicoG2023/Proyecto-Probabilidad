import axios from 'axios';
import { keycloak } from '../auth/keycloak';

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE as string,
});

http.interceptors.request.use(async (config) => {
  if (keycloak.authenticated) {
    await keycloak.updateToken(60).catch(() => keycloak.login());
    if (keycloak.token) {
      config.headers = config.headers ?? {};
      (config.headers as any).Authorization = `Bearer ${keycloak.token}`;
    }
  }
  return config;
});
