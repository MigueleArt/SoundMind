import type { Request, Response } from 'express';

import {
  supabaseAdmin,
  supabaseAuth
} from '../config/supabase.js';

import { env } from '../config/env.js';

import {
  forgotPasswordSchema,
  loginSchema,
  refreshSchema,
  registerSchema,
  resetPasswordSchema
} from '../schemas/auth.schema.js';

function validationError(res: Response, issues: unknown) {
  return res.status(400).json({
    error: 'Datos inválidos',
    details: issues
  });
}

export async function register(req: Request, res: Response) {
  const validation = registerSchema.safeParse(req.body);

  if (!validation.success) {
    return validationError(
      res,
      validation.error.flatten().fieldErrors
    );
  }

  const {
    email,
    username,
    fullName,
    password
  } = validation.data;

  const { data, error } = await supabaseAuth.auth.signUp({
    email: email.toLowerCase(),
    password,
    options: {
      data: {
        username,
        full_name: fullName ?? null
      }
    }
  });

  if (error) {
    console.error('Registration error:', error);

    return res.status(400).json({
      error: error.message
    });
  }

  return res.status(201).json({
    message: data.session
      ? 'Cuenta creada correctamente'
      : 'Cuenta creada. Revisa tu correo para confirmarla.',
    token: data.session?.access_token ?? null,
    refreshToken: data.session?.refresh_token ?? null,
    expiresIn: data.session?.expires_in ?? null,
    user: data.user
      ? {
          id: data.user.id,
          email: data.user.email,
          username
        }
      : null
  });
}

export async function login(req: Request, res: Response) {
  const validation = loginSchema.safeParse(req.body);

  if (!validation.success) {
    return validationError(
      res,
      validation.error.flatten().fieldErrors
    );
  }

  const { email, password } = validation.data;

  const { data, error } =
    await supabaseAuth.auth.signInWithPassword({
      email: email.toLowerCase(),
      password
    });

  if (error || !data.session) {
    return res.status(401).json({
      error: 'Correo o contraseña incorrectos'
    });
  }

  return res.json({
    token: data.session.access_token,
    refreshToken: data.session.refresh_token,
    expiresIn: data.session.expires_in,
    user: {
      id: data.user.id,
      email: data.user.email,
      username:
        data.user.user_metadata?.username ??
        data.user.email?.split('@')[0]
    }
  });
}

export async function refresh(req: Request, res: Response) {
  const validation = refreshSchema.safeParse(req.body);

  if (!validation.success) {
    return validationError(
      res,
      validation.error.flatten().fieldErrors
    );
  }

  const { data, error } =
    await supabaseAuth.auth.refreshSession({
      refresh_token: validation.data.refreshToken
    });

  if (error || !data.session) {
    return res.status(401).json({
      error: 'Refresh token inválido o expirado'
    });
  }

  return res.json({
    token: data.session.access_token,
    refreshToken: data.session.refresh_token,
    expiresIn: data.session.expires_in
  });
}

export async function logout(req: Request, res: Response) {
  if (!req.accessToken) {
    return res.status(401).json({
      error: 'Token requerido'
    });
  }

  const { error } =
    await supabaseAdmin.auth.admin.signOut(
      req.accessToken,
      'local'
    );

  if (error) {
    console.error('Logout error:', error);

    return res.status(400).json({
      error: 'No se pudo cerrar la sesión'
    });
  }

  return res.json({
    message: 'Sesión cerrada correctamente'
  });
}

export async function me(req: Request, res: Response) {
  if (!req.authUser) {
    return res.status(401).json({
      error: 'No autorizado'
    });
  }

  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select(
      'id, username, full_name, avatar_url, created_at, updated_at'
    )
    .eq('id', req.authUser.id)
    .single();

  if (error) {
    console.error('Profile query error:', error);

    return res.status(404).json({
      error: 'Perfil no encontrado'
    });
  }

  return res.json({
    user: {
      ...profile,
      email: req.authUser.email
    }
  });
}

export async function forgotPassword(
  req: Request,
  res: Response
) {
  const validation = forgotPasswordSchema.safeParse(req.body);

  if (!validation.success) {
    return validationError(
      res,
      validation.error.flatten().fieldErrors
    );
  }

  const { error } =
    await supabaseAuth.auth.resetPasswordForEmail(
      validation.data.email.toLowerCase(),
      {
        redirectTo: `${env.APP_URL}/reset-password`
      }
    );

  if (error) {
    console.error('Password recovery error:', error);
  }

  // Respuesta genérica para no revelar si el correo existe.
  return res.json({
    message:
      'Si el correo está registrado, recibirá instrucciones para recuperar la cuenta.'
  });
}

export async function resetPassword(
  req: Request,
  res: Response
) {
  const validation = resetPasswordSchema.safeParse(req.body);

  if (!validation.success) {
    return validationError(
      res,
      validation.error.flatten().fieldErrors
    );
  }

  if (!req.authUser) {
    return res.status(401).json({
      error: 'Token de recuperación inválido'
    });
  }

  const { error } =
    await supabaseAdmin.auth.admin.updateUserById(
      req.authUser.id,
      {
        password: validation.data.password
      }
    );

  if (error) {
    console.error('Password reset error:', error);

    return res.status(400).json({
      error: 'No se pudo actualizar la contraseña'
    });
  }

  return res.json({
    message: 'Contraseña actualizada correctamente'
  });
}