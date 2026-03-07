import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AuthApiError, me, refresh } from './auth-client';
import {
  AuthSessionProvider,
  useAuthSessionState,
} from './auth-session-provider';

vi.mock('./auth-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./auth-client')>();

  return {
    ...actual,
    refresh: vi.fn(),
    me: vi.fn(),
  };
});

const mockRefresh = vi.mocked(refresh);
const mockMe = vi.mocked(me);

afterEach(() => {
  vi.restoreAllMocks();
});

function Wrapper({ children }: { children: ReactNode }) {
  return <AuthSessionProvider>{children}</AuthSessionProvider>;
}

describe('session restore (via provider)', () => {
  it('sets authenticated on successful refresh + me', async () => {
    const user = { id: '1', email: 'a@b.com', name: 'A' };
    mockRefresh.mockResolvedValueOnce({ accessToken: 'tok' });
    mockMe.mockResolvedValueOnce(user);

    const { result } = renderHook(() => useAuthSessionState(), {
      wrapper: Wrapper,
    });

    await waitFor(() => {
      expect(result.current).toEqual({
        status: 'authenticated',
        accessToken: 'tok',
        user,
      });
    });
  });

  it('sets anonymous when refresh returns 401', async () => {
    mockRefresh.mockRejectedValueOnce(new AuthApiError(401, 'Unauthorized'));

    const { result } = renderHook(() => useAuthSessionState(), {
      wrapper: Wrapper,
    });

    await waitFor(() => {
      expect(result.current).toEqual({ status: 'anonymous' });
    });
  });

  it('stays unknown when refresh fails unexpectedly', async () => {
    mockRefresh.mockRejectedValueOnce(new Error('Network down'));

    const { result } = renderHook(() => useAuthSessionState(), {
      wrapper: Wrapper,
    });

    // Non-auth errors → setUnknown (same as initial)
    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalled();
    });

    expect(result.current).toEqual({ status: 'unknown' });
  });

  it('stays unknown when me fails after successful refresh', async () => {
    mockRefresh.mockResolvedValueOnce({ accessToken: 'tok' });
    mockMe.mockRejectedValueOnce(new Error('500'));

    const { result } = renderHook(() => useAuthSessionState(), {
      wrapper: Wrapper,
    });

    await waitFor(() => {
      expect(mockMe).toHaveBeenCalled();
    });

    expect(result.current).toEqual({ status: 'unknown' });
  });
});
