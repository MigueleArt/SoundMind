import { AuthTokens, User } from '../types';

const TOKEN_KEY = 'soundmind_token';
const REFRESH_TOKEN_KEY = 'soundmind_refresh_token';
const USER_KEY = 'soundmind_user';

// --- Gestión de Almacenamiento Local ---

export const authStorage = {
  saveSession: (tokens: AuthTokens, user: User) => {
    localStorage.setItem(TOKEN_KEY, tokens.token);
    if (tokens.refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
    }
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  getToken: (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
  },

  getRefreshToken: (): string | null => {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  getUser: (): User | null => {
    const userStr = localStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  },

  clearSession: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

// --- Cliente HTTP con Bearer Token Automático ---

export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = authStorage.getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  // Adjunta el token si el usuario no es invitado y existe en almacenamiento
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Ocurrió un error al procesar la solicitud.');
  }

  return data as T;
}