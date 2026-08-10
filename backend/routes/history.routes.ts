import { Router } from 'express';

import {
  getHistory,
  getHistoryById,
  removeHistoryItem
} from '../controllers/history.controller.js';

import { requireAuth } from '../middleware/auth.js';

export const historyRouter = Router();

historyRouter.use(requireAuth);

historyRouter.get('/', getHistory);
historyRouter.get('/:sessionId', getHistoryById);
historyRouter.delete('/:sessionId', removeHistoryItem);