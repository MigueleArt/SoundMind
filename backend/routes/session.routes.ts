import { Router } from 'express';

import { createSession } from '../controllers/session.controller.js';
import { requireAuth } from '../middleware/auth.js';

export const sessionRouter = Router();

sessionRouter.use(requireAuth);
sessionRouter.post('/', createSession);