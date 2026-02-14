import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '@/utils/api-error.js';

// Each test sets these before calling the service function.
let selectResult: unknown[] = [];
let selectQueue: unknown[][] = [];
let insertResult: unknown[] = [];
const updateWhereFn = vi.fn();

// *** Mock @repo/database/index ***
vi.mock('@repo/database/index', () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => selectQueue.shift() ?? selectResult,
      }),
    }),
    insert: () => ({
      values: (vals: unknown) => {
        // store for assertion if needed
        insertResult.push(vals);
        return {
          returning: () => insertResult,
        };
      },
    }),
    update: () => ({
      set: () => ({
        where: updateWhereFn,
      }),
    }),
  },
  eq: vi.fn((_col, val) => val),
  users: { id: 'users.id', email: 'users.email', name: 'users.name' },
  refreshTokens: {
    jti: 'refreshTokens.jti',
    familyId: 'refreshTokens.familyId',
    userId: 'refreshTokens.userId',
  },
}));

// *** Mock @repo/auth/* ***
vi.mock('@repo/auth/password', () => ({
  hashPassword: vi.fn(() => Promise.resolve('hashed-password')),
}));

vi.mock('@repo/auth/jwt', () => ({
  signAccessToken: vi.fn(() => 'mock-access-token'),
  signRefreshToken: vi.fn(() => ({
    token: 'mock-refresh-token',
    jti: 'mock-jti',
  })),
  verifyRefreshToken: vi.fn(() => ({
    userId: 'user-1',
    jti: 'old-jti',
    familyId: 'family-1',
  })),
}));

vi.mock('@repo/auth/hash', () => ({
  hashToken: vi.fn((token: string) => `hashed-${token}`),
}));

// Import after mock
const {
  createUser,
  findUserByEmail,
  createTokenPair,
  rotateRefreshToken,
  revokeTokenFamily,
  revokeAllUserTokens,
} = await import('./auth.service.js');

beforeEach(() => {
  selectResult = [];
  selectQueue = [];
  insertResult = [];
  updateWhereFn.mockClear();
});

describe('createUser', () => {
  const input = {
    email: 'test@example.com',
    name: 'Test',
    password: 'Str0ng!pw',
  };

  it('should create a user when email is not taken', async () => {
    selectResult = []; // findUserByEmail returns null
    insertResult = [{ id: 'user-1', email: input.email, name: input.name }];

    const user = await createUser(input);

    expect(user).toEqual({
      id: 'user-1',
      email: input.email,
      name: input.name,
    });
  });

  it('should throw 409 when email already exists', async () => {
    selectResult = [{ id: 'existing', email: input.email }]; // findUserByEmail returns user

    await expect(createUser(input)).rejects.toThrow(
      new ApiError(409, 'Email already registered'),
    );
  });
});

describe('findUserByEmail', () => {
  it('should return user when found', async () => {
    const mockUser = { id: 'user-1', email: 'found@example.com' };
    selectResult = [mockUser];

    const result = await findUserByEmail('found@example.com');

    expect(result).toEqual(mockUser);
  });

  it('should return null when not found', async () => {
    selectResult = [];

    const result = await findUserByEmail('missing@example.com');

    expect(result).toBeNull();
  });
});

describe('createTokenPair', () => {
  it('should return access and refresh tokens', async () => {
    insertResult = []; // db.insert for refresh_tokens, no returning needed

    const result = await createTokenPair('user-1', 'test@example.com');

    expect(result).toEqual({
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
    });
  });
});

describe('rotateRefreshToken', () => {
  it('should rotate a valid refresh token and return new pair', async () => {
    selectQueue = [
      [
        {
          tokenHash: 'hashed-old-refresh-token',
          revokedAt: null,
        },
      ],
      [{ id: 'user-1', email: 'test@example.com' }],
    ];

    const result = await rotateRefreshToken('old-refresh-token');

    expect(result).toEqual({
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
    });
    expect(updateWhereFn).toHaveBeenCalledTimes(1);
  });

  it('should throw 401 and revoke family when token not found in DB', async () => {
    selectResult = [];

    await expect(rotateRefreshToken('old-refresh-token')).rejects.toThrow(
      new ApiError(401, 'Invalid refresh token'),
    );
    expect(updateWhereFn).toHaveBeenCalledWith('family-1');
  });

  it('should throw 401 and revoke family when token was already revoked', async () => {
    selectResult = [
      {
        tokenHash: 'hashed-old-refresh-token',
        revokedAt: new Date(),
      },
    ];

    await expect(rotateRefreshToken('old-refresh-token')).rejects.toThrow(
      new ApiError(401, 'Invalid refresh token'),
    );
    expect(updateWhereFn).toHaveBeenCalledWith('family-1');
  });

  it('should throw 401 and revoke family when user no longer exists', async () => {
    selectQueue = [
      [
        {
          tokenHash: 'hashed-old-refresh-token',
          revokedAt: null,
        },
      ],
      [],
    ];

    await expect(rotateRefreshToken('old-refresh-token')).rejects.toThrow(
      new ApiError(401, 'User no longer exists'),
    );
    expect(updateWhereFn).toHaveBeenCalledWith('family-1');
  });
});

// *** revokeTokenFamily ***

describe('revokeTokenFamily', () => {
  it('should call db.update with the family id', async () => {
    await revokeTokenFamily('family-1');

    expect(updateWhereFn).toHaveBeenCalledWith('family-1');
  });
});

// *** revokeAllUserTokens ***

describe('revokeAllUserTokens', () => {
  it('should call db.update with the user id', async () => {
    await revokeAllUserTokens('user-1');

    expect(updateWhereFn).toHaveBeenCalledWith('user-1');
  });
});
