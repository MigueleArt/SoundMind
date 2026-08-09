import { Router } from 'express';

import { createSession } from '../controllers/session.controller';
import { requireAuth } from '../middleware/auth';

export const sessionRouter = Router();

sessionRouter.use(requireAuth);
sessionRouter.post('/', createSession);