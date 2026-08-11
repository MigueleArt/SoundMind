import { Router } from 'express';

import {
  deleteFeedback,
  legacyLike,
  updateFeedback
} from '../controllers/feedback.controller.js';

import { requireAuth } from '../middleware/auth.js';

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