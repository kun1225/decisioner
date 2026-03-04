import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { AuthSessionActions } from './auth-session-provider';

vi.mock('./auth-client', () => ({
  refresh: vi.fn(),
  me: vi.fn(),
}));

import { me, refresh } from './auth-client';
import { useSessionRestore } from './use-session-restore';

const mockRefresh = vi.mocked(refresh);
const mockMe = vi.mocked(me);

function createMockActions(): Pick<
  AuthSessionActions,
  'setAuthenticated' | 'setAnonymous'
> {
  return {
    setAuthenticated: vi.fn(),
    setAnonymous: vi.fn(),
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useSessionRestore', () => {
  it('calls setAuthenticated on successful refresh and me', async () => {
    const user = { id: '1', email: 'a@b.com', name: 'A' };
    mockRefresh.mockResolvedValueOnce({ accessToken: 'tok' });
    mockMe.mockResolvedValueOnce(user);

    const actions = createMockActions();
    renderHook(() => useSessionRestore(actions));

    await waitFor(() => {
      expect(actions.setAuthenticated).toHaveBeenCalledWith({
        accessToken: 'tok',
        user,
      });
    });

    expect(actions.setAnonymous).not.toHaveBeenCalled();
  });

  it('calls setAnonymous when refresh fails', async () => {
    mockRefresh.mockRejectedValueOnce(new Error('401'));

    const actions = createMockActions();
    renderHook(() => useSessionRestore(actions));

    await waitFor(() => {
      expect(actions.setAnonymous).toHaveBeenCalled();
    });

    expect(actions.setAuthenticated).not.toHaveBeenCalled();
  });

  it('calls setAnonymous when me fails after successful refresh', async () => {
    mockRefresh.mockResolvedValueOnce({ accessToken: 'tok' });
    mockMe.mockRejectedValueOnce(new Error('500'));

    const actions = createMockActions();
    renderHook(() => useSessionRestore(actions));

    await waitFor(() => {
      expect(actions.setAnonymous).toHaveBeenCalled();
    });

    expect(actions.setAuthenticated).not.toHaveBeenCalled();
  });

  it('does not run restore twice in StrictMode', async () => {
    const user = { id: '1', email: 'a@b.com', name: 'A' };
    mockRefresh.mockResolvedValue({ accessToken: 'tok' });
    mockMe.mockResolvedValue(user);

    const actions = createMockActions();

    const { StrictMode } = await import('react');
    renderHook(() => useSessionRestore(actions), {
      wrapper: StrictMode,
    });

    await waitFor(() => {
      expect(actions.setAuthenticated).toHaveBeenCalledTimes(1);
    });

    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });
});
