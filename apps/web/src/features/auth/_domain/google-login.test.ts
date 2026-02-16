import { afterEach, describe, expect, it, vi } from 'vitest';

import { createFetchResponse } from '@/lib/mock-fetch';

import { googleLogin, isGoogleLoginEnabled } from './google-login';

const originalFetch = globalThis.fetch;

describe('google-login', () => {
  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('parses feature flag truthy values', () => {
    expect(isGoogleLoginEnabled('true')).toBe(true);
    expect(isGoogleLoginEnabled('1')).toBe(true);
    expect(isGoogleLoginEnabled('yes')).toBe(true);
    expect(isGoogleLoginEnabled('false')).toBe(false);
    expect(isGoogleLoginEnabled(undefined)).toBe(false);
  });

  it('calls google login endpoint with idToken payload', async () => {
    const fetchSpy = vi.fn().mockResolvedValue(
      createFetchResponse({
        accessToken: 'token-3',
      }),
    );
    globalThis.fetch = fetchSpy as typeof fetch;

    const result = await googleLogin('id-token-1');

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(String(fetchSpy.mock.calls[0]?.[0])).toContain('/api/auth/google');
    expect(result).toEqual({ accessToken: 'token-3' });
  });
});
