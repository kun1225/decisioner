import { describe, expect, it } from 'vitest';

import { isAuthUser, normalizeAuthUser } from './auth-types';

describe('auth-types', () => {
  it('checks user shape', () => {
    expect(
      isAuthUser({
        id: 'u-1',
        email: 'joy@example.com',
        name: 'Joy',
      }),
    ).toBe(true);
    expect(isAuthUser({ id: 'u-1' })).toBe(false);
  });

  it('normalizes user payload', () => {
    const result = normalizeAuthUser({
      id: 'u-1',
      email: 'joy@example.com',
      name: 'Joy',
    });

    expect(result).toEqual({
      id: 'u-1',
      email: 'joy@example.com',
      name: 'Joy',
    });
  });

  it('throws on invalid user payload', () => {
    expect(() => normalizeAuthUser({ id: 1 })).toThrowError(
      'Invalid auth user payload',
    );
  });
});
