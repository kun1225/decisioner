import { describe, expect, it } from 'vitest';

import { normalizeRegisterRedirectTarget } from './auth.register';

describe('auth.register redirect', () => {
  it('defaults to root path', () => {
    expect(normalizeRegisterRedirectTarget(undefined)).toBe('/');
  });

  it('accepts internal path', () => {
    expect(normalizeRegisterRedirectTarget('/progress')).toBe('/progress');
  });

  it('rejects unsafe redirect input', () => {
    expect(normalizeRegisterRedirectTarget('http://evil.example.com')).toBe(
      '/',
    );
    expect(normalizeRegisterRedirectTarget('//evil.example.com')).toBe('/');
  });
});
