import type { RequestHandler } from 'express';

import { verifyAccessToken } from '@repo/auth/jwt';

import { ApiError } from '@/utils/api-error.js';

export const requireAuth: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    throw new ApiError(401, 'Missing or invalid Authorization header');
  }

  const token = header.slice(7);

  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    throw new ApiError(401, 'Invalid or expired token');
  }
};
