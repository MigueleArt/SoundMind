import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),

  PORT: z.coerce
    .number()
    .int()
    .positive()
    .default(3000),

  APP_URL: z
    .string()
    .url()
    .default('http://localhost:3000'),

  SUPABASE_URL: z
    .string()
    .url('SUPABASE_URL debe ser una URL válida'),

  SUPABASE_PUBLISHABLE_KEY: z
    .string()
    .min(1, 'Falta SUPABASE_PUBLISHABLE_KEY'),

  SUPABASE_SECRET_KEY: z
    .string()
    .min(1, 'Falta SUPABASE_SECRET_KEY'),

  GEMINI_API_KEY: z
    .string()
    .optional()
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error('Variables de entorno inválidas:');

  for (const issue of result.error.issues) {
    console.error(`- ${issue.path.join('.')}: ${issue.message}`);
  }

  throw new Error('No se pudo iniciar el servidor');
}

export const env = result.data;