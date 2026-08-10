import { Router } from 'express';

import {
  deleteFeedback,
  legacyLike,
  updateFeedback
} from '../controllers/feedback.controller';

import { requireAuth } from '../middleware/auth';

export const recommendationRouter = Router();

recommendationRouter.post(
  '/like',
  requireAuth,
  legacyLike
);

recommendationRouter.put(
  '/:recommendationId/feedback',
  requireAuth,
  updateFeedback
);

recommendationRouter.delete(
  '/:recommendationId/feedback',
  requireAuth,
  deleteFeedback
);