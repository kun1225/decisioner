import { randomUUID } from 'node:crypto';

import jwt from 'jsonwebtoken';

import type { AccessTokenPayload, RefreshTokenPayload } from './types.js';

const getAccessSecret = () => {
  const secret = process.env.ACCESS_TOKEN_SECRET;
  if (!secret) throw new Error('ACCESS_TOKEN_SECRET is not defined');
  return secret;
};

const getRefreshSecret = () => {
  const secret = process.env.REFRESH_TOKEN_SECRET;
  if (!secret) throw new Error('REFRESH_TOKEN_SECRET is not defined');
  return secret;
};

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, getAccessSecret(), { expiresIn: '15m' });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, getAccessSecret()) as AccessTokenPayload;
}

export function signRefreshToken(
  userId: string,
  familyId: string,
): { token: string; jti: string } {
  const jti = randomUUID();
  const payload: RefreshTokenPayload = { userId, jti, familyId };
  const token = jwt.sign(payload, getRefreshSecret(), { expiresIn: '30d' });
  return { token, jti };
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, getRefreshSecret()) as RefreshTokenPayload;
}
