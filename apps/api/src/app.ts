import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';

import { createCorsOptions } from '@/middleware/cors-config.js';
import { errorHandler } from '@/middleware/error-handler.js';

import { authRoutes } from './modules/auth/auth.routes.js';
import { exerciseRoutes } from './modules/exercises/exercise.routes.js';

export function createApp(): express.Express {
  const app = express();
  const corsOptions = createCorsOptions();

  // *** Global middleware ***
  app.use(cors(corsOptions));
  app.use(express.json());
  app.use(cookieParser());

  // *** Health check ***
  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  // *** Routes ***
  app.use('/api/auth', authRoutes);
  app.use('/api/exercises', exerciseRoutes);

  // *** Error handler (must be last) ***
  app.use(errorHandler);

  return app;
}
