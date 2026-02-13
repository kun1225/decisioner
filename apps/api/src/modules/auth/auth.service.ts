import { randomUUID } from 'node:crypto';

import { hashToken } from '@repo/auth/hash';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '@repo/auth/jwt';
import { hashPassword } from '@repo/auth/password';
import { db, eq, refreshTokens, users } from '@repo/database/index';

import { ApiError } from '../../utils/api-error.js';

// *** User Operations ***

export async function createUser(input: {
  email: string;
  name: string;
  password: string;
}) {
  const existing = await findUserByEmail(input.email);
  if (existing) {
    throw new ApiError(409, 'Email already registered');
  }

  const hashed = await hashPassword(input.password);

  const [user] = await db
    .insert(users)
    .values({
      email: input.email,
      name: input.name,
      hashedPassword: hashed,
      authProvider: 'LOCAL',
    })
    .returning({ id: users.id, email: users.email, name: users.name });

  return user!;
}

export async function findUserByEmail(email: string) {
  const [user] = await db.select().from(users).where(eq(users.email, email));
  return user ?? null;
}

async function findUserById(id: string) {
  const [user] = await db.select().from(users).where(eq(users.id, id));
  return user ?? null;
}

// *** Token Operations ***

export async function createTokenPair(userId: string, email: string) {
  const familyId = randomUUID();
  const accessToken = signAccessToken({ userId, email });
  const { token: refreshToken, jti } = signRefreshToken(userId, familyId);

  await db.insert(refreshTokens).values({
    userId,
    jti,
    familyId,
    tokenHash: hashToken(refreshToken),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });

  return { accessToken, refreshToken };
}

export async function rotateRefreshToken(oldToken: string) {
  const decoded = verifyRefreshToken(oldToken);

  const [stored] = await db
    .select()
    .from(refreshTokens)
    .where(eq(refreshTokens.jti, decoded.jti));

  // Token not found or already revoked → possible reuse attack
  if (!stored || stored.revokedAt) {
    // Revoke the entire family as a precaution
    if (decoded.familyId) {
      await revokeTokenFamily(decoded.familyId);
    }
    throw new ApiError(401, 'Invalid refresh token');
  }

  // Hash doesn't match
  if (stored.tokenHash !== hashToken(oldToken)) {
    await revokeTokenFamily(decoded.familyId);
    throw new ApiError(401, 'Invalid refresh token');
  }

  // Issue new pair in the same family
  const user = await findUserById(decoded.userId);
  if (!user) {
    await revokeTokenFamily(decoded.familyId);
    throw new ApiError(401, 'User no longer exists');
  }

  const accessToken = signAccessToken({
    userId: decoded.userId,
    email: user.email,
  });
  const { token: newRefreshToken, jti: newJti } = signRefreshToken(
    decoded.userId,
    decoded.familyId,
  );

  // Revoke old token, insert new one
  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date(), replacedByJti: newJti })
    .where(eq(refreshTokens.jti, decoded.jti));

  await db.insert(refreshTokens).values({
    userId: decoded.userId,
    jti: newJti,
    familyId: decoded.familyId,
    tokenHash: hashToken(newRefreshToken),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });

  return { accessToken, refreshToken: newRefreshToken };
}

// *** Revocation ***

export async function revokeTokenFamily(familyId: string) {
  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(eq(refreshTokens.familyId, familyId));
}

export async function revokeAllUserTokens(userId: string) {
  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(eq(refreshTokens.userId, userId));
}
