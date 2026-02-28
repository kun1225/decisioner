import { describe, expect, it } from 'vitest';

import { AuthApiError } from '@/features/auth/_domain/auth-client';

import { mapAuthApiErrorToFormErrors } from './form-error-mapper';

describe('form-error-mapper', () => {
  it('maps api details to field errors when paths are known', () => {
    const error = new AuthApiError(400, 'Validation failed', [
      { path: 'email', message: 'Invalid email address' },
      { path: 'password', message: 'Password is too weak' },
    ]);

    const result = mapAuthApiErrorToFormErrors(error, [
      'email',
      'password',
      'confirmedPassword',
      'name',
    ]);

    expect(result).toEqual({
      formError: null,
      fieldErrors: {
        email: 'Invalid email address',
        password: 'Password is too weak',
      },
    });
  });

  it('returns form-level message when details are absent', () => {
    const error = new AuthApiError(401, 'Invalid email or password');

    const result = mapAuthApiErrorToFormErrors(error, [
      'email',
      'password',
      'confirmedPassword',
      'name',
    ]);

    expect(result).toEqual({
      formError: 'Invalid email or password',
      fieldErrors: {},
    });
  });

  it('ignores unknown detail paths and falls back to form-level message', () => {
    const error = new AuthApiError(400, 'Validation failed', [
      { path: 'profile.age', message: 'Age must be positive' },
    ]);

    const result = mapAuthApiErrorToFormErrors(error, [
      'email',
      'password',
      'confirmedPassword',
      'name',
    ]);

    expect(result).toEqual({
      formError: 'Validation failed',
      fieldErrors: {},
    });
  });

  it('maps unknown errors to fallback message', () => {
    const result = mapAuthApiErrorToFormErrors({ any: 'thing' }, ['email']);

    expect(result).toEqual({
      formError: 'Something went wrong. Please try again.',
      fieldErrors: {},
    });
  });
});
