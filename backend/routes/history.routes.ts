import { Router } from 'express';

import {
  getHistory,
  getHistoryById,
  removeHistoryItem
} from '../controllers/history.controller';

import { requireAuth } from '../middleware/auth';

export const historyRouter = Router();

historyRouter.use(requireAuth);

historyRouter.get('/', getHistory);
historyRouter.get('/:sessionId', getHistoryById);
historyRouter.delete('/:sessionId', removeHistoryItem);