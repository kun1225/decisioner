import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'

import {
  AuthSessionProvider,
  useAuthSessionActions,
  useAuthSessionState,
} from './auth-session-provider'

function Wrapper({ children }: { children: ReactNode }) {
  return <AuthSessionProvider>{children}</AuthSessionProvider>
}

describe('auth-session-provider', () => {
  it('exposes unknown as initial state', () => {
    const { result } = renderHook(() => useAuthSessionState(), {
      wrapper: Wrapper,
    })

    expect(result.current).toEqual({ status: 'unknown' })
  })

  it('updates state via split hooks', () => {
    const { result } = renderHook(
      () => ({
        state: useAuthSessionState(),
        actions: useAuthSessionActions(),
      }),
      { wrapper: Wrapper },
    )

    act(() => {
      result.current.actions.setAuthenticated({
        accessToken: 'token',
        user: {
          id: 'u1',
          email: 'joy@example.com',
          name: 'Joy',
        },
      })
    })

    expect(result.current.state).toEqual({
      status: 'authenticated',
      accessToken: 'token',
      user: {
        id: 'u1',
        email: 'joy@example.com',
        name: 'Joy',
      },
    })

    act(() => {
      result.current.actions.setAnonymous()
    })

    expect(result.current.state).toEqual({ status: 'anonymous' })

    act(() => {
      result.current.actions.setUnknown()
    })

    expect(result.current.state).toEqual({ status: 'unknown' })
  })

  it('throws when hook is used outside provider', () => {
    expect(() => renderHook(() => useAuthSessionState())).toThrow(
      'useAuthSessionState must be used inside AuthSessionProvider',
    )
    expect(() => renderHook(() => useAuthSessionActions())).toThrow(
      'useAuthSessionActions must be used inside AuthSessionProvider',
    )
  })
})
