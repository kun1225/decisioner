import { describe, expect, it } from 'vitest';

import { googleLoginSchema, loginSchema, registerSchema } from './auth.js';

describe('registerSchema', () => {
  it('should accept valid input', () => {
    const result = registerSchema.safeParse({
      email: 'test@example.com',
      password: 'Secure@123',
      name: 'Test User',
    });

    expect(result.success).toBe(true);
  });

  it('should reject invalid email', () => {
    const result = registerSchema.safeParse({
      email: 'not-an-email',
      password: 'Secure@123',
      name: 'Test User',
    });

    expect(result.success).toBe(false);
  });

  it('should reject short password', () => {
    const result = registerSchema.safeParse({
      email: 'test@example.com',
      password: '1234567',
      name: 'Test User',
    });

    expect(result.success).toBe(false);
  });

  it('should reject password over 72 characters', () => {
    const result = registerSchema.safeParse({
      email: 'test@example.com',
      password: 'a'.repeat(73),
      name: 'Test User',
    });

    expect(result.success).toBe(false);
  });

  it('should reject password without uppercase', () => {
    const result = registerSchema.safeParse({
      email: 'test@example.com',
      password: 'secure@123',
      name: 'Test User',
    });

    expect(result.success).toBe(false);
  });

  it('should reject password without lowercase', () => {
    const result = registerSchema.safeParse({
      email: 'test@example.com',
      password: 'SECURE@123',
      name: 'Test User',
    });

    expect(result.success).toBe(false);
  });

  it('should reject password without special character', () => {
    const result = registerSchema.safeParse({
      email: 'test@example.com',
      password: 'Secure1234',
      name: 'Test User',
    });

    expect(result.success).toBe(false);
  });

  it('should reject empty name', () => {
    const result = registerSchema.safeParse({
      email: 'test@example.com',
      password: 'Secure@123',
      name: '',
    });

    expect(result.success).toBe(false);
  });

  it('should reject missing fields', () => {
    const result = registerSchema.safeParse({});

    expect(result.success).toBe(false);
  });
});

describe('loginSchema', () => {
  it('should accept valid input', () => {
    const result = loginSchema.safeParse({
      email: 'test@example.com',
      password: 'mypassword',
    });

    expect(result.success).toBe(true);
  });

  it('should reject invalid email', () => {
    const result = loginSchema.safeParse({
      email: 'bad',
      password: 'mypassword',
    });

    expect(result.success).toBe(false);
  });

  it('should reject empty password', () => {
    const result = loginSchema.safeParse({
      email: 'test@example.com',
      password: '',
    });

    expect(result.success).toBe(false);
  });
});

describe('googleLoginSchema', () => {
  it('should accept valid idToken', () => {
    const result = googleLoginSchema.safeParse({
      idToken: 'some-google-id-token',
    });

    expect(result.success).toBe(true);
  });

  it('should reject empty idToken', () => {
    const result = googleLoginSchema.safeParse({
      idToken: '',
    });

    expect(result.success).toBe(false);
  });

  it('should reject missing idToken', () => {
    const result = googleLoginSchema.safeParse({});

    expect(result.success).toBe(false);
  });
});
