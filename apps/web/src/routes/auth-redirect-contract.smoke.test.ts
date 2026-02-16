import { describe, expect, it } from 'vitest';

import { buildReLoginHref } from '@/features/auth/_components/auth-gate';

import { normalizeRedirectTarget } from './auth.login';
import { normalizeRegisterRedirectTarget } from './auth.register';

function decodeRedirect(href: string): string {
  const url = new URL(href, 'https://example.test');
  return url.searchParams.get('redirect') ?? '';
}

describe('auth redirect contract smoke', () => {
  it('encodes current path into re-login href', () => {
    const href = buildReLoginHref('/progress?tab=weekly');
    expect(href).toBe('/auth/login?redirect=%2Fprogress%3Ftab%3Dweekly');
  });

  it('keeps encoded redirect safe after decode-normalize on login route', () => {
    const href = buildReLoginHref('/progress?tab=weekly');
    const decodedRedirect = decodeRedirect(href);
    const normalized = normalizeRedirectTarget(decodedRedirect);

    expect(normalized).toBe('/progress?tab=weekly');
  });

  it('keeps encoded redirect safe after decode-normalize on register route', () => {
    const href = buildReLoginHref('/train/start');
    const decodedRedirect = decodeRedirect(href);
    const normalized = normalizeRegisterRedirectTarget(decodedRedirect);

    expect(normalized).toBe('/train/start');
  });

  it('drops protocol-relative redirects consistently', () => {
    const normalizedLogin = normalizeRedirectTarget('//evil.example');
    const normalizedRegister =
      normalizeRegisterRedirectTarget('//evil.example');

    expect(normalizedLogin).toBe('/');
    expect(normalizedRegister).toBe('/');
  });

  it('drops absolute protocol redirects consistently', () => {
    const normalizedLogin = normalizeRedirectTarget('https://evil.example');
    const normalizedRegister = normalizeRegisterRedirectTarget(
      'https://evil.example',
    );

    expect(normalizedLogin).toBe('/');
    expect(normalizedRegister).toBe('/');
  });
});
