import { z } from 'zod';

const passwordSchema = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .max(72, 'La contraseña es demasiado larga')
  .regex(/[a-z]/, 'Debe incluir una letra minúscula')
  .regex(/[A-Z]/, 'Debe incluir una letra mayúscula')
  .regex(/[0-9]/, 'Debe incluir un número');

export const registerSchema = z.object({
  email: z
    .string()
    .trim()
    .email('Correo electrónico inválido')
    .max(254),

  username: z
    .string()
    .trim()
    .min(3, 'El usuario debe tener al menos 3 caracteres')
    .max(40, 'El usuario no puede superar 40 caracteres')
    .regex(
      /^[a-zA-Z0-9_.-]+$/,
      'El usuario solo admite letras, números, punto, guion y guion bajo'
    ),

  fullName: z
    .string()
    .trim()
    .max(100)
    .optional(),

  password: passwordSchema
});

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email('Correo electrónico inválido'),

  password: z
    .string()
    .min(1, 'La contraseña es obligatoria')
});

export const refreshSchema = z.object({
  refreshToken: z
    .string()
    .min(1, 'El refresh token es obligatorio')
});

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .email('Correo electrónico inválido')
});

export const resetPasswordSchema = z.object({
  password: passwordSchema
});