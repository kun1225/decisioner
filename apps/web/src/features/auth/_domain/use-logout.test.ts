import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { logout } from './auth-client';
import { useLogout } from './use-logout';

vi.mock('./auth-client', () => ({
  logout: vi.fn(),
}));

const mockNavigate = vi.fn().mockResolvedValue(undefined);
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('./auth-session-provider', () => ({
  useAuthSessionActions: () => ({
    setAnonymous: mockSetAnonymous,
    setAuthenticated: vi.fn(),
    setUnknown: vi.fn(),
  }),
}));

const mockSetAnonymous = vi.fn();

const mockLogout = vi.mocked(logout);

afterEach(() => {
  vi.clearAllMocks();
});

describe('useLogout', () => {
  it('calls logout API, sets anonymous, and navigates to /', async () => {
    mockLogout.mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useLogout());

    await act(async () => {
      await result.current.handleLogout();
    });

    expect(mockLogout).toHaveBeenCalled();
    expect(mockSetAnonymous).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/' });
  });

  it('sets anonymous and navigates even when logout API fails', async () => {
    mockLogout.mockRejectedValueOnce(new Error('network'));

    const { result } = renderHook(() => useLogout());

    await act(async () => {
      await result.current.handleLogout();
    });

    expect(mockSetAnonymous).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/' });
  });

  it('tracks isLoggingOut state during the operation', async () => {
    let resolveLogout!: () => void;
    mockLogout.mockReturnValueOnce(
      new Promise<void>((r) => {
        resolveLogout = r;
      }),
    );

    const { result } = renderHook(() => useLogout());

    expect(result.current.isLoggingOut).toBe(false);

    let logoutPromise: Promise<void>;
    act(() => {
      logoutPromise = result.current.handleLogout();
    });

    expect(result.current.isLoggingOut).toBe(true);

    await act(async () => {
      resolveLogout();
      await logoutPromise!;
    });

    expect(result.current.isLoggingOut).toBe(false);
  });
});
