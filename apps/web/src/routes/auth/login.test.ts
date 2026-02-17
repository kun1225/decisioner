import { describe, expect, it } from 'vitest';

import { normalizeRedirectTarget } from './login';

describe('auth.login redirect', () => {
  it('defaults to root for missing values', () => {
    expect(normalizeRedirectTarget(undefined)).toBe('/');
  });

  it('allows internal relative path redirects', () => {
    expect(normalizeRedirectTarget('/train/start')).toBe('/train/start');
  });

  it('rejects absolute protocol and protocol-relative redirects', () => {
    expect(normalizeRedirectTarget('https://evil.example.com')).toBe('/');
    expect(normalizeRedirectTarget('//evil.example.com')).toBe('/');
  });

  it('rejects javascript pseudo-protocol redirects', () => {
    expect(normalizeRedirectTarget('javascript:alert(1)')).toBe('/');
  });
});
