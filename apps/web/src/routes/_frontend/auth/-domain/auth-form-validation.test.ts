import { describe, expect, it } from 'vitest';

import { validateLoginInput, validateRegisterInput } from './auth-form-validation';

describe('auth-form-validation', () => {
  it('validates login email and password required rule', () => {
    expect(
      validateLoginInput({
        email: 'bad-email',
        password: '',
      }),
    ).toEqual({
      email: 'Invalid email address',
      password: 'Password is required',
    });
  });

  it('requires name and email for registration', () => {
    expect(
      validateRegisterInput({
        email: 'invalid',
        name: '',
        password: 'Passw0rd!',
        confirmedPassword: 'Passw0rd!',
      }),
    ).toEqual({
      email: 'Invalid email address',
      name: 'Name is required',
    });
  });

  it('checks name max length', () => {
    expect(
      validateRegisterInput({
        email: 'joy@example.com',
        name: 'a'.repeat(256),
        password: 'Passw0rd!',
        confirmedPassword: 'Passw0rd!',
      }),
    ).toEqual({
      name: 'Name must be at most 255 characters',
    });
  });

  it('checks password minimum and maximum length', () => {
    expect(
      validateRegisterInput({
        email: 'joy@example.com',
        name: 'Joy',
        password: 'P1!a',
        confirmedPassword: 'P1!a',
      }),
    ).toEqual({
      password: 'Password must be at least 8 characters',
    });

    expect(
      validateRegisterInput({
        email: 'joy@example.com',
        name: 'Joy',
        password: `${'A'.repeat(73)}!a`,
        confirmedPassword: `${'A'.repeat(73)}!a`,
      }),
    ).toEqual({
      password: 'Password must be at most 72 characters',
    });
  });

  it('checks password character class rules', () => {
    expect(
      validateRegisterInput({
        email: 'joy@example.com',
        name: 'Joy',
        password: 'PASSWORD1!',
        confirmedPassword: 'PASSWORD1!',
      }),
    ).toEqual({
      password: 'Password must contain a lowercase letter',
    });

    expect(
      validateRegisterInput({
        email: 'joy@example.com',
        name: 'Joy',
        password: 'password1!',
        confirmedPassword: 'password1!',
      }),
    ).toEqual({
      password: 'Password must contain an uppercase letter',
    });

    expect(
      validateRegisterInput({
        email: 'joy@example.com',
        name: 'Joy',
        password: 'Password123',
        confirmedPassword: 'Password123',
      }),
    ).toEqual({
      password: 'Password must contain a special character',
    });
  });

  it('checks confirmed password match', () => {
    expect(
      validateRegisterInput({
        email: 'joy@example.com',
        name: 'Joy',
        password: 'Passw0rd!',
        confirmedPassword: 'Passw1rd!',
      }),
    ).toEqual({
      confirmedPassword: 'Passwords do not match',
    });
  });
});
