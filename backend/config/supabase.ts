import { createClient } from '@supabase/supabase-js';
import NodeWebSocket from 'ws';
import { env } from './env';

/**
 * Supabase declara el transporte utilizando el tipo WebSocket del navegador,
 * pero Node.js 20 necesita la implementación proporcionada por "ws".
 * La conversión solo adapta los tipos; en ejecución sigue utilizándose "ws".
 */
const websocketTransport =
  NodeWebSocket as unknown as typeof globalThis.WebSocket;

const commonOptions = {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  },
  realtime: {
    transport: websocketTransport
  }
};

/**
 * Cliente utilizado para registro, login y validación.
 */
export const supabaseAuth = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_PUBLISHABLE_KEY,
  commonOptions
);

/**
 * Cliente administrativo exclusivo del backend.
 */
export const supabaseAdmin = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SECRET_KEY,
  commonOptions
);