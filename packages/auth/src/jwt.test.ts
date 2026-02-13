import { describe, expect, it, vi } from 'vitest';

import {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from './jwt.js';

const ACCESS_SECRET = 'test-access-secret';
const REFRESH_SECRET = 'test-refresh-secret';

vi.stubEnv('ACCESS_TOKEN_SECRET', ACCESS_SECRET);
vi.stubEnv('REFRESH_TOKEN_SECRET', REFRESH_SECRET);

describe('Access Token', () => {
  const payload = { userId: 'user-123', email: 'test@example.com' };

  it('should sign and verify a valid access token', () => {
    const token = signAccessToken(payload);
    const decoded = verifyAccessToken(token);

    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.email).toBe(payload.email);
  });

  it('should throw on invalid token', () => {
    expect(() => verifyAccessToken('invalid-token')).toThrow();
  });

  it('should throw on token signed with wrong secret', async () => {
    const jwt = await import('jsonwebtoken');
    const badToken = jwt.default.sign(payload, 'wrong-secret', {
      expiresIn: '15m',
    });

    expect(() => verifyAccessToken(badToken)).toThrow();
  });

  it('should throw on expired token', async () => {
    const jwt = await import('jsonwebtoken');
    const expiredToken = jwt.default.sign(payload, ACCESS_SECRET, {
      expiresIn: '0s',
    });

    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(() => verifyAccessToken(expiredToken)).toThrow();
  });
});

describe('Refresh Token', () => {
  const userId = 'user-456';
  const familyId = 'family-abc';

  it('should sign and verify a valid refresh token', () => {
    const { token, jti } = signRefreshToken(userId, familyId);
    const decoded = verifyRefreshToken(token);

    expect(decoded.userId).toBe(userId);
    expect(decoded.familyId).toBe(familyId);
    expect(decoded.jti).toBe(jti);
  });

  it('should generate unique jti for each token', () => {
    const result1 = signRefreshToken(userId, familyId);
    const result2 = signRefreshToken(userId, familyId);

    expect(result1.jti).not.toBe(result2.jti);
  });

  it('should throw on invalid token', () => {
    expect(() => verifyRefreshToken('invalid-token')).toThrow();
  });

  it('should throw on token signed with wrong secret', async () => {
    const jwt = await import('jsonwebtoken');
    const badToken = jwt.default.sign(
      { userId, jti: 'jti-123', familyId },
      'wrong-secret',
      { expiresIn: '30d' },
    );

    expect(() => verifyRefreshToken(badToken)).toThrow();
  });

  it('should not verify access token as refresh token', () => {
    const accessToken = signAccessToken({ userId, email: 'test@example.com' });

    expect(() => verifyRefreshToken(accessToken)).toThrow();
  });

  it('should not verify refresh token as access token', () => {
    const { token } = signRefreshToken(userId, familyId);

    expect(() => verifyAccessToken(token)).toThrow();
  });
});
