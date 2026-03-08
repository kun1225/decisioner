import { describe, expect, it, vi } from 'vitest';

import type { AuthSessionState } from './auth-types';
import { requireAuthenticatedRoute } from './require-authenticated-route';

function createContext(state: AuthSessionState) {
  return {
    getAuthSessionState: vi.fn(() => state),
    waitForAuthReady: vi.fn().mockResolvedValue(undefined),
  };
}

function createDeps(
  overrides?: Partial<Parameters<typeof requireAuthenticatedRoute>[1]>,
) {
  return {
    checkSessionPresence: vi.fn().mockResolvedValue(true),
    isServer: vi.fn(() => false),
    redirectToLogin: vi.fn((locationHref: string) => {
      throw new Error(`redirect:${locationHref}`);
    }),
    ...overrides,
  };
}

describe('requireAuthenticatedRoute', () => {
  it('redirects on server when session presence is missing', async () => {
    const context = createContext({ status: 'unknown' });
    const deps = createDeps({
      isServer: vi.fn(() => true),
      checkSessionPresence: vi.fn().mockResolvedValue(false),
    });

    await expect(
      requireAuthenticatedRoute(
        { context, location: { href: '/dashboard' } },
        deps,
      ),
    ).rejects.toThrow('redirect:/dashboard');

    expect(context.waitForAuthReady).not.toHaveBeenCalled();
  });

  it('fails closed on server when presence check throws', async () => {
    const context = createContext({ status: 'unknown' });
    const deps = createDeps({
      isServer: vi.fn(() => true),
      checkSessionPresence: vi
        .fn()
        .mockRejectedValue(new Error('cookie failure')),
    });

    await expect(
      requireAuthenticatedRoute(
        { context, location: { href: '/dashboard' } },
        deps,
      ),
    ).rejects.toThrow('redirect:/dashboard');
  });

  it('allows server access when session presence exists', async () => {
    const context = createContext({ status: 'unknown' });
    const deps = createDeps({
      isServer: vi.fn(() => true),
      checkSessionPresence: vi.fn().mockResolvedValue(true),
    });

    await expect(
      requireAuthenticatedRoute(
        { context, location: { href: '/dashboard' } },
        deps,
      ),
    ).resolves.toBeUndefined();

    expect(deps.redirectToLogin).not.toHaveBeenCalled();
  });

  it('waits for auth readiness on the client when state is unknown', async () => {
    const context = createContext({ status: 'unknown' });
    const deps = createDeps();

    await expect(
      requireAuthenticatedRoute(
        { context, location: { href: '/dashboard' } },
        deps,
      ),
    ).rejects.toThrow('redirect:/dashboard');

    expect(context.waitForAuthReady).toHaveBeenCalledTimes(1);
  });

  it('redirects on the client when auth is not authenticated after readiness', async () => {
    const context = {
      getAuthSessionState: vi
        .fn<() => AuthSessionState>()
        .mockReturnValueOnce({ status: 'unknown' })
        .mockReturnValueOnce({ status: 'anonymous' }),
      waitForAuthReady: vi.fn().mockResolvedValue(undefined),
    };
    const deps = createDeps();

    await expect(
      requireAuthenticatedRoute(
        { context, location: { href: '/dashboard?tab=plans' } },
        deps,
      ),
    ).rejects.toThrow('redirect:/dashboard?tab=plans');
  });

  it('allows client access when auth is already authenticated', async () => {
    const context = createContext({
      status: 'authenticated',
      accessToken: 'tok',
      user: { id: 'u1', email: 'joy@example.com', name: 'Joy' },
    });
    const deps = createDeps();

    await expect(
      requireAuthenticatedRoute(
        { context, location: { href: '/dashboard' } },
        deps,
      ),
    ).resolves.toBeUndefined();

    expect(context.waitForAuthReady).not.toHaveBeenCalled();
    expect(deps.redirectToLogin).not.toHaveBeenCalled();
  });
});
