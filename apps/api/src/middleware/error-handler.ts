import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';

import { ApiError } from '@/utils/api-error.js';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error(err);

  if (err instanceof ApiError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  if (err instanceof ZodError) {
    const details = err.issues.map((e) => ({
      path: e.path.join('.'),
      message: e.message,
    }));
    res.status(400).json({ error: 'Validation failed', details });
    return;
  }

  res.status(500).json({ error: 'Internal server error' });
};
