import { fireEvent, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '@/lib/render-with-providers'

import { LogoutButton } from './logout-button'

const useAuthSessionMock = vi.fn()
const performLogoutMock = vi.fn()

vi.mock('../_domain/auth-session-store', () => ({
  useAuthSession: () => useAuthSessionMock(),
}))

vi.mock('../_domain/logout-action', () => ({
  performLogout: (...args: unknown[]) => performLogoutMock(...args),
}))

describe('logout-button', () => {
  beforeEach(() => {
    useAuthSessionMock.mockReset()
    performLogoutMock.mockReset()
  })

  it('hides button when user is not authenticated', () => {
    useAuthSessionMock.mockReturnValue({
      state: { status: 'guest', user: null, accessToken: null },
      setGuest: vi.fn(),
    })

    renderWithProviders(<LogoutButton />)

    expect(screen.queryByRole('button', { name: 'Sign Out' })).toBeNull()
  })

  it('runs logout action for authenticated user', async () => {
    const setGuest = vi.fn()
    useAuthSessionMock.mockReturnValue({
      state: {
        status: 'authenticated',
        user: { id: 'u-1', email: 'joy@example.com', name: 'Joy' },
        accessToken: 'token-1',
      },
      setGuest,
    })
    performLogoutMock.mockResolvedValue(undefined)

    renderWithProviders(<LogoutButton />)

    fireEvent.click(screen.getByRole('button', { name: 'Sign Out' }))

    await waitFor(() => {
      expect(performLogoutMock).toHaveBeenCalledTimes(1)
    })
    expect(performLogoutMock.mock.calls[0]?.[0]).toMatchObject({
      setGuest,
    })
    expect(setGuest).toHaveBeenCalledTimes(0)
  })

  it('shows pending state while logout request is in progress', async () => {
    let resolveLogout: (() => void) | null = null
    performLogoutMock.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveLogout = resolve
        }),
    )
    useAuthSessionMock.mockReturnValue({
      state: {
        status: 'authenticated',
        user: { id: 'u-1', email: 'joy@example.com', name: 'Joy' },
        accessToken: 'token-1',
      },
      setGuest: vi.fn(),
    })

    renderWithProviders(<LogoutButton />)

    fireEvent.click(screen.getByRole('button', { name: 'Sign Out' }))
    expect(screen.getByRole('button', { name: 'Signing Out...' })).toBeDefined()

    resolveLogout?.()
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Sign Out' })).toBeDefined()
    })
  })
})
