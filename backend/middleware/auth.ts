import type {
  NextFunction,
  Request,
  Response
} from 'express';

import { supabaseAuth } from '../config/supabase.js';

export interface AuthenticatedUser {
  id: string;
  email: string | null;
  username: string;
}

declare global {
  namespace Express {
    interface Request {
      authUser?: AuthenticatedUser;
      accessToken?: string;
    }
  }
}

function extractBearerToken(req: Request): string | null {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith('Bearer ')) {
    return null;
  }

  const token = authorization.slice(7).trim();

  return token.length > 0 ? token : null;
}

async function validateToken(req: Request): Promise<boolean> {
  const token = extractBearerToken(req);

  if (!token) {
    return false;
  }

  const {
    data: { user },
    error
  } = await supabaseAuth.auth.getUser(token);

  if (error || !user) {
    return false;
  }

  req.accessToken = token;
  req.authUser = {
    id: user.id,
    email: user.email ?? null,
    username:
      String(user.user_metadata?.username ?? '') ||
      user.email?.split('@')[0] ||
      'usuario'
  };

  return true;
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authenticated = await validateToken(req);

    if (!authenticated) {
      return res.status(401).json({
        error: 'Token ausente, inválido o expirado'
      });
    }

    next();
  } catch (error) {
    console.error('JWT validation error:', error);

    return res.status(401).json({
      error: 'No se pudo validar la sesión'
    });
  }
}

export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authorization = req.headers.authorization;

  if (!authorization) {
    return next();
  }

  try {
    const authenticated = await validateToken(req);

    if (!authenticated) {
      return res.status(401).json({
        error: 'El token proporcionado es inválido o expiró'
      });
    }

    next();
  } catch (error) {
    console.error('Optional JWT validation error:', error);

    return res.status(401).json({
      error: 'No se pudo validar la sesión'
    });
  }
}