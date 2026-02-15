import type { RequestHandler } from 'express';

import { verifyRefreshToken } from '@repo/auth/jwt';
import { verifyPassword } from '@repo/auth/password';
import { loginSchema, registerSchema } from '@repo/shared/auth';

import { ApiError } from '@/utils/api-error.js';

import {
  createTokenPair,
  createUser,
  findUserByEmail,
  findUserById,
  revokeTokenFamily,
} from './auth.service.js';

const REFRESH_COOKIE = 'refresh_token';
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function setRefreshCookie(res: Parameters<RequestHandler>[1], token: string) {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/auth',
    maxAge: THIRTY_DAYS_MS,
  });
}

function clearRefreshCookie(res: Parameters<RequestHandler>[1]) {
  res.clearCookie(REFRESH_COOKIE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/auth',
  });
}

// POST /api/auth/register
export const register: RequestHandler = async (req, res) => {
  const { email, name, password } = registerSchema.parse(req.body);

  const user = await createUser({ email, name, password });
  const tokens = await createTokenPair(user.id, user.email);

  setRefreshCookie(res, tokens.refreshToken);
  res.status(201).json({ user, accessToken: tokens.accessToken });
};

// POST /api/auth/login
export const login: RequestHandler = async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);

  const user = await findUserByEmail(email);
  if (!user || !user.hashedPassword) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const valid = await verifyPassword(password, user.hashedPassword);
  if (!valid) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const tokens = await createTokenPair(user.id, user.email);

  setRefreshCookie(res, tokens.refreshToken);
  res.json({ accessToken: tokens.accessToken });
};

// POST /api/auth/refresh
export const refresh: RequestHandler = async (req, res) => {
  const oldToken = req.cookies?.[REFRESH_COOKIE];
  if (!oldToken) {
    throw new ApiError(401, 'Missing refresh token');
  }

  const { rotateRefreshToken } = await import('./auth.service.js');
  const tokens = await rotateRefreshToken(oldToken);

  setRefreshCookie(res, tokens.refreshToken);
  res.json({ accessToken: tokens.accessToken });
};

// POST /api/auth/logout
export const logout: RequestHandler = async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE];

  if (token) {
    try {
      const decoded = verifyRefreshToken(token);
      await revokeTokenFamily(decoded.familyId);
    } catch {
      // Token is invalid/expired — just clear the cookie
    }
  }

  clearRefreshCookie(res);
  res.status(204).end();
};

// GET /api/auth/me
export const me: RequestHandler = async (req, res) => {
  const user = await findUserById(req.user!.userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { hashedPassword: _, googleSub: __, ...safeUser } = user;
  res.json(safeUser);
};
