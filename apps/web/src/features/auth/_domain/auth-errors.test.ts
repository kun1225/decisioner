import { describe, expect, it } from 'vitest';

import {
  AuthApiError,
  isUnauthorizedError,
  mapAuthApiError,
} from './auth-errors';

describe('auth-errors', () => {
  it('maps plain error object into AuthApiError', () => {
    const error = mapAuthApiError({
      status: 401,
      message: 'Unauthorized',
      code: 'UNAUTHENTICATED',
    });

    expect(error).toBeInstanceOf(AuthApiError);
    expect(error.status).toBe(401);
    expect(error.code).toBe('UNAUTHENTICATED');
    expect(error.message).toBe('Unauthorized');
  });

  it('treats unknown value as network failure', () => {
    const error = mapAuthApiError('boom');
    expect(error.status).toBe(0);
    expect(error.code).toBe('NETWORK_ERROR');
  });

  it('detects unauthorized errors', () => {
    const unauthorized = new AuthApiError({
      status: 401,
      code: 'UNAUTHENTICATED',
      message: 'Unauthorized',
    });
    const conflict = new AuthApiError({
      status: 409,
      code: 'CONFLICT',
      message: 'Email conflict',
    });

    expect(isUnauthorizedError(unauthorized)).toBe(true);
    expect(isUnauthorizedError(conflict)).toBe(false);
  });
});
