import { describe, expect, it } from 'vitest';

import {
  DEFAULT_POST_AUTH_REDIRECT,
  resolvePostAuthRedirect,
  sanitizeRedirectTarget,
} from './redirect-target';

describe('redirect-target', () => {
  it('accepts safe internal redirect paths', () => {
    expect(sanitizeRedirectTarget('/dashboard')).toBe('/dashboard');
    expect(sanitizeRedirectTarget('/workouts/history?tab=all')).toBe(
      '/workouts/history?tab=all',
    );
  });

  it('rejects unsafe redirect paths', () => {
    expect(sanitizeRedirectTarget('https://evil.example')).toBeNull();
    expect(sanitizeRedirectTarget('//evil.example')).toBeNull();
    expect(sanitizeRedirectTarget('dashboard')).toBeNull();
    expect(sanitizeRedirectTarget('   ')).toBeNull();
  });

  it('falls back to default redirect when target is invalid', () => {
    expect(DEFAULT_POST_AUTH_REDIRECT).toBe('/dashboard');
    expect(resolvePostAuthRedirect(undefined)).toBe('/dashboard');
    expect(resolvePostAuthRedirect('https://evil.example')).toBe('/dashboard');
  });

  it('returns sanitized redirect when target is valid', () => {
    expect(resolvePostAuthRedirect('/settings')).toBe('/settings');
  });
});
