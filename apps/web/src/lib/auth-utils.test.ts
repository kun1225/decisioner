import { describe, expect, it } from 'vitest';

import { normalizeRedirectPath } from './auth-utils';

describe('auth-utils', () => {
  describe('normalizeRedirectPath', () => {
    it('defaults to root for missing values', () => {
      expect(normalizeRedirectPath(undefined)).toBe('/');
    });

    it('allows internal relative path redirects', () => {
      expect(normalizeRedirectPath('/train/start')).toBe('/train/start');
      expect(normalizeRedirectPath('/progress')).toBe('/progress');
    });

    it('rejects absolute protocol and protocol-relative redirects', () => {
      expect(normalizeRedirectPath('https://evil.example.com')).toBe('/');
      expect(normalizeRedirectPath('//evil.example.com')).toBe('/');
    });

    it('rejects javascript pseudo-protocol redirects', () => {
      expect(normalizeRedirectPath('javascript:alert(1)')).toBe('/');
    });
  });
});
