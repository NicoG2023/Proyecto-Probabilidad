import { http } from './http';
import type { KcUser } from '../types/auth';

type RolesReq = { roles: string[] };
const ROLE_CLIENT = 'client';

export const HIDDEN_ROLES = new Set([
  'default-roles-cinema',
  'offline_access',
  'uma_authorization',
]);

export const VISIBLE_ROLES = new Set(['admin', 'Customer']);

// Convierte cualquier cosa rara (JSON-P, etc) a string plano
const toStr = (v: any): string | undefined => {
  if (v == null) return undefined;
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (typeof v === 'object') {
    if (typeof (v as any).string === 'string') return (v as any).string;
    if (typeof (v as any).chars === 'string') return (v as any).chars;
  }
  try { return JSON.stringify(v); } catch { return String(v); }
};

// Asegura un KcUser “plano”
const normalizeUser = (u: any): KcUser => ({
  id: toStr(u?.id) ?? '',
  username: toStr(u?.username) ?? '',
  email: toStr(u?.email),
  enabled: Boolean(u?.enabled),
  realmRoles: Array.isArray(u?.realmRoles)
    ? (u.realmRoles as any[]).map(toStr).filter(Boolean) as string[]
    : undefined,
});

export const AuthApi = {
  ROLE_CLIENT,

  createUser: (payload: { username: string; email: string; password: string }) =>
    http.post<{ id: string }>('/api/auth/users', payload).then(r => r.data),

  // LISTA: normaliza array completo SIEMPRE
  listUsers: (q?: string, first?: number, max?: number) =>
    http
      .get<any[]>('/api/auth/users', { params: { q, first, max } })
      .then(r => (Array.isArray(r.data) ? r.data.map(normalizeUser) : [])),

  // DETALLE: normaliza respuesta
  getUser: (id: string) =>
    http.get<any>(`/api/auth/users/${encodeURIComponent(id)}`).then(r => normalizeUser(r.data)),

  promoteToAdmin: (id: string) =>
    http.post<void>(`/api/auth/users/${encodeURIComponent(id)}/promote-admin`, {}),

  setEnabled: (id: string, enabled: boolean) =>
    http.put<void>(`/api/auth/users/${encodeURIComponent(id)}/enabled`, { enabled }),

  addRealmRoles: (id: string, roles: string[]) =>
    http.post<void>(`/api/auth/users/${encodeURIComponent(id)}/roles/realm`, { roles } satisfies RolesReq),

  removeRealmRoles: (id: string, roles: string[]) =>
    http.delete<void>(`/api/auth/users/${encodeURIComponent(id)}/roles/realm`, { data: { roles } as RolesReq }),

  ensureClientRole: async (id: string, hasClient: boolean) => {
    if (!hasClient) await AuthApi.addRealmRoles(id, [ROLE_CLIENT]);
  },

  removeClientRole: async (id: string, hasClient: boolean) => {
    if (hasClient) await AuthApi.removeRealmRoles(id, [ROLE_CLIENT]);
  },
};
