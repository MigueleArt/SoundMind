import type { Request, Response } from 'express';

import {
  deleteHistoryItem,
  findHistoryByUser,
  findHistoryItem
} from '../repositories/history.repository.js';

import { mapHistoryItem } from '../services/history.service.js';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function getHistory(
  req: Request,
  res: Response
) {
  if (!req.authUser) {
    return res.status(401).json({
      error: 'No autorizado'
    });
  }

  const { data, error } =
    await findHistoryByUser(req.authUser.id);

  if (error) {
    console.error('Get history error:', error);

    return res.status(500).json({
      error: 'No se pudo obtener el historial'
    });
  }

  const history = (data ?? []).map((session) =>
    mapHistoryItem(session, req.authUser!.id)
  );

  return res.json({ history });
}

export async function getHistoryById(
  req: Request,
  res: Response
) {
  if (!req.authUser) {
    return res.status(401).json({
      error: 'No autorizado'
    });
  }

  const { sessionId } = req.params;

  if (!UUID_PATTERN.test(sessionId)) {
    return res.status(400).json({
      error: 'Identificador de sesión inválido'
    });
  }

  const { data, error } = await findHistoryItem(
    req.authUser.id,
    sessionId
  );

  if (error) {
    console.error('Get history item error:', error);

    return res.status(500).json({
      error: 'No se pudo obtener la sesión'
    });
  }

  if (!data) {
    return res.status(404).json({
      error: 'Sesión no encontrada'
    });
  }

  return res.json({
    session: mapHistoryItem(
      data,
      req.authUser.id
    )
  });
}

export async function removeHistoryItem(
  req: Request,
  res: Response
) {
  if (!req.authUser) {
    return res.status(401).json({
      error: 'No autorizado'
    });
  }

  const { sessionId } = req.params;

  if (!UUID_PATTERN.test(sessionId)) {
    return res.status(400).json({
      error: 'Identificador de sesión inválido'
    });
  }

  const { data, error } = await deleteHistoryItem(
    req.authUser.id,
    sessionId
  );

  if (error) {
    console.error('Delete history error:', error);

    return res.status(500).json({
      error: 'No se pudo eliminar la sesión'
    });
  }

  if (!data) {
    return res.status(404).json({
      error: 'Sesión no encontrada'
    });
  }

  return res.json({
    message: 'Sesión eliminada correctamente',
    id: data.id
  });
}