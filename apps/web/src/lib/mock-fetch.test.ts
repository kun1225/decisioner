import { describe, expect, it } from 'vitest';

import { createFetchResponse, mockFetchJsonOnce } from './mock-fetch';

describe('mock-fetch', () => {
  it('creates a fetch response with provided status', async () => {
    const response = createFetchResponse({ ok: false }, { status: 401 });

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ ok: false });
  });

  it('mocks fetch once with json payload', async () => {
    const originalFetch = globalThis.fetch;

    mockFetchJsonOnce({ accessToken: 'token' }, { status: 200 });

    const response = await fetch('/api/auth/login');
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ accessToken: 'token' });

    globalThis.fetch = originalFetch;
  });
});
