import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'

import { useAuthSession } from '@/features/auth/_domain/auth-session-provider'

import { Provider, getContext } from './index'

describe('providers index wiring', () => {
  it('provides both query client and auth session context', () => {
    const { queryClient } = getContext()

    const wrapper = ({ children }: { children: ReactNode }) => (
      <Provider queryClient={queryClient}>{children}</Provider>
    )

    const { result } = renderHook(
      () => ({
        queryClient: useQueryClient(),
        auth: useAuthSession(),
      }),
      { wrapper },
    )

    expect(result.current.queryClient).toBe(queryClient)
    expect(result.current.auth.state).toEqual({ status: 'unknown' })

    act(() => {
      result.current.auth.actions.setAnonymous()
    })

    expect(result.current.auth.state).toEqual({ status: 'anonymous' })
  })
})
