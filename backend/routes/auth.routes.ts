import { Router } from 'express';

import {
  forgotPassword,
  login,
  logout,
  me,
  refresh,
  register,
  resetPassword
} from '../controllers/auth.controller';

import { requireAuth } from '../middleware/auth';

export const authRouter = Router();

authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.post('/refresh', refresh);
authRouter.post('/forgot-password', forgotPassword);

authRouter.post(
  '/reset-password',
  requireAuth,
  resetPassword
);

authRouter.post(
  '/logout',
  requireAuth,
  logout
);

authRouter.get(
  '/me',
  requireAuth,
  me
);