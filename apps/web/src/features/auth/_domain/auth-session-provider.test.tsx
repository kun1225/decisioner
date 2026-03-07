import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import {
  AuthSessionProvider,
  useAuthSessionActions,
  useAuthSessionState,
} from './auth-session-provider';

vi.mock('./auth-client', () => ({
  AuthApiError: class AuthApiError extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.status = status;
    }
  },
  refresh: vi.fn().mockRejectedValue(new Error('not mocked')),
  me: vi.fn().mockRejectedValue(new Error('not mocked')),
}));

function Wrapper({ children }: { children: ReactNode }) {
  return <AuthSessionProvider>{children}</AuthSessionProvider>;
}

describe('auth-session-provider', () => {
  it('exposes unknown as initial state', () => {
    const { result } = renderHook(() => useAuthSessionState(), {
      wrapper: Wrapper,
    });

    expect(result.current).toEqual({ status: 'unknown' });
  });

  it('updates state via split hooks', () => {
    const { result } = renderHook(
      () => ({
        state: useAuthSessionState(),
        actions: useAuthSessionActions(),
      }),
      { wrapper: Wrapper },
    );

    act(() => {
      result.current.actions.setAuthenticated({
        accessToken: 'token',
        user: {
          id: 'u1',
          email: 'joy@example.com',
          name: 'Joy',
        },
      });
    });

    expect(result.current.state).toEqual({
      status: 'authenticated',
      accessToken: 'token',
      user: {
        id: 'u1',
        email: 'joy@example.com',
        name: 'Joy',
      },
    });

    act(() => {
      result.current.actions.setAnonymous();
    });

    expect(result.current.state).toEqual({ status: 'anonymous' });

    act(() => {
      result.current.actions.setUnknown();
    });

    expect(result.current.state).toEqual({ status: 'unknown' });
  });

  it('throws when hook is used outside provider', () => {
    expect(() => renderHook(() => useAuthSessionState())).toThrow(
      'useAuthSessionState must be used inside AuthSessionProvider',
    );
    expect(() => renderHook(() => useAuthSessionActions())).toThrow(
      'useAuthSessionActions must be used inside AuthSessionProvider',
    );
  });

  it('calls onStateChange when state changes', () => {
    const onStateChange = vi.fn();

    const wrapper = ({ children }: { children: ReactNode }) => (
      <AuthSessionProvider onStateChange={onStateChange}>
        {children}
      </AuthSessionProvider>
    );

    const { result } = renderHook(
      () => useAuthSessionActions(),
      { wrapper },
    );

    // Initial call with unknown state
    expect(onStateChange).toHaveBeenCalledWith({ status: 'unknown' });

    act(() => {
      result.current.setAnonymous();
    });

    expect(onStateChange).toHaveBeenCalledWith({ status: 'anonymous' });
  });
});
