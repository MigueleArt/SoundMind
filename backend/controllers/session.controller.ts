import type { Request, Response } from 'express';

import { createSessionSchema } from '../schemas/session.schema';
import { createMusicSession } from '../services/session.service';
import { findHistoryItem } from '../repositories/history.repository';
import { mapHistoryItem } from '../services/history.service';

export async function createSession(
  req: Request,
  res: Response
) {
  if (!req.authUser) {
    return res.status(401).json({
      error: 'No autorizado'
    });
  }

  const validation = createSessionSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      error: 'Datos de sesión inválidos',
      details: validation.error.flatten().fieldErrors
    });
  }

  try {
    const sessionId = await createMusicSession(
      req.authUser.id,
      validation.data
    );

    const { data, error } = await findHistoryItem(
      req.authUser.id,
      sessionId
    );

    if (error || !data) {
      return res.status(201).json({
        message: 'Sesión guardada correctamente',
        id: sessionId
      });
    }

    return res.status(201).json({
      message: 'Sesión guardada correctamente',
      session: mapHistoryItem(data, req.authUser.id)
    });
  } catch (error) {
    console.error('Create session error:', error);

    return res.status(500).json({
      error: 'No se pudo guardar la sesión musical'
    });
  }
}