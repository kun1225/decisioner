import cookieParser from 'cookie-parser';
import express from 'express';

import { errorHandler } from '@/middleware/error-handler.js';

import { authRoutes } from './modules/auth/auth.routes.js';
import { exerciseRoutes } from './modules/exercises/exercise.routes.js';
import { templateRoutes } from './modules/templates/template.routes.js';

export function createApp(): express.Express {
  const app = express();

  // *** Global middleware ***
  app.use(express.json());
  app.use(cookieParser());

  // *** Health check ***
  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  // *** Routes ***
  app.use('/api/auth', authRoutes);
  app.use('/api/exercises', exerciseRoutes);
  app.use('/api/templates', templateRoutes);

  // *** Error handler (must be last) ***
  app.use(errorHandler);

  return app;
}
