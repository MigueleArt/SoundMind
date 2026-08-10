import type { Request, Response } from 'express';
import { z } from 'zod';

import { supabaseAdmin } from '../config/supabase.js';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const feedbackSchema = z.object({
  isLiked: z.boolean()
});

async function recommendationBelongsToUser(
  recommendationId: string,
  userId: string
) {
  const { data: recommendation, error } =
    await supabaseAdmin
      .from('recommendations')
      .select('id, session_id')
      .eq('id', recommendationId)
      .maybeSingle();

  if (error || !recommendation) return false;

  const { data: session } = await supabaseAdmin
    .from('music_sessions')
    .select('id')
    .eq('id', recommendation.session_id)
    .eq('user_id', userId)
    .maybeSingle();

  return Boolean(session);
}

async function saveFeedback(
  userId: string,
  recommendationId: string,
  isLiked: boolean
) {
  const allowed = await recommendationBelongsToUser(
    recommendationId,
    userId
  );

  if (!allowed) {
    return {
      status: 404,
      body: {
        error: 'Recomendación no encontrada'
      }
    };
  }

  const { data, error } = await supabaseAdmin
    .from('feedback')
    .upsert(
      {
        user_id: userId,
        recommendation_id: recommendationId,
        is_liked: isLiked
      },
      {
        onConflict: 'user_id,recommendation_id'
      }
    )
    .select('recommendation_id, is_liked, updated_at')
    .single();

  if (error) {
    console.error('Save feedback error:', error);

    return {
      status: 500,
      body: {
        error: 'No se pudo guardar el feedback'
      }
    };
  }

  return {
    status: 200,
    body: {
      message: 'Feedback guardado correctamente',
      feedback: {
        recommendationId: data.recommendation_id,
        isLiked: data.is_liked,
        updatedAt: data.updated_at
      }
    }
  };
}

export async function updateFeedback(
  req: Request,
  res: Response
) {
  if (!req.authUser) {
    return res.status(401).json({
      error: 'No autorizado'
    });
  }

  const { recommendationId } = req.params;

  if (!UUID_PATTERN.test(recommendationId)) {
    return res.status(400).json({
      error: 'Identificador inválido'
    });
  }

  const validation = feedbackSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      error: 'isLiked debe ser true o false'
    });
  }

  const result = await saveFeedback(
    req.authUser.id,
    recommendationId,
    validation.data.isLiked
  );

  return res.status(result.status).json(result.body);
}

/**
 * Compatibilidad con el frontend actual:
 * POST /api/recommendations/like
 */
export async function legacyLike(
  req: Request,
  res: Response
) {
  if (!req.authUser) {
    return res.status(401).json({
      error: 'No autorizado'
    });
  }

  const validation = z.object({
    sessionId: z.string().optional(),
    songId: z.string().uuid(),
    isLiked: z.boolean()
  }).safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      error: 'Datos de feedback inválidos'
    });
  }

  const result = await saveFeedback(
    req.authUser.id,
    validation.data.songId,
    validation.data.isLiked
  );

  return res.status(result.status).json(result.body);
}

export async function deleteFeedback(
  req: Request,
  res: Response
) {
  if (!req.authUser) {
    return res.status(401).json({
      error: 'No autorizado'
    });
  }

  const { recommendationId } = req.params;

  if (!UUID_PATTERN.test(recommendationId)) {
    return res.status(400).json({
      error: 'Identificador inválido'
    });
  }

  const { data, error } = await supabaseAdmin
    .from('feedback')
    .delete()
    .eq('recommendation_id', recommendationId)
    .eq('user_id', req.authUser.id)
    .select('id')
    .maybeSingle();

  if (error) {
    return res.status(500).json({
      error: 'No se pudo eliminar el feedback'
    });
  }

  if (!data) {
    return res.status(404).json({
      error: 'Feedback no encontrado'
    });
  }

  return res.json({
    message: 'Feedback eliminado correctamente'
  });
}