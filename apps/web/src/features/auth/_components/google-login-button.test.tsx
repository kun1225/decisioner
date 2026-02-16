import { fireEvent, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '@/lib/render-with-providers'

import { GoogleLoginButton } from './google-login-button'

const googleLoginMock = vi.fn()
const setAccessTokenMock = vi.fn()

vi.mock('../_domain/google-login', () => ({
  googleLogin: (...args: Array<unknown>) => googleLoginMock(...args),
  isGoogleLoginEnabled: () => false,
}))

vi.mock('../_domain/token-storage', () => ({
  setAccessToken: (...args: Array<unknown>) => setAccessTokenMock(...args),
}))

describe('google-login-button', () => {
  beforeEach(() => {
    googleLoginMock.mockReset()
    setAccessTokenMock.mockReset()
  })

  it('does not render when disabled', () => {
    renderWithProviders(<GoogleLoginButton />)

    expect(screen.queryByRole('button', { name: 'Continue with Google' })).toBeNull()
  })

  it('runs google login when enabled', async () => {
    googleLoginMock.mockResolvedValue({ accessToken: 'token-3' })
    const getIdToken = vi.fn().mockResolvedValue('id-token-1')
    const onSuccess = vi.fn()

    renderWithProviders(
      <GoogleLoginButton enabled getIdToken={getIdToken} onSuccess={onSuccess} />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Continue with Google' }))

    await waitFor(() => {
      expect(googleLoginMock).toHaveBeenCalledWith('id-token-1')
    })
    expect(setAccessTokenMock).toHaveBeenCalledWith('token-3')
    expect(onSuccess).toHaveBeenCalledWith('token-3')
  })

  it('shows failure message when login fails', async () => {
    googleLoginMock.mockRejectedValue(new Error('Google login unavailable'))

    renderWithProviders(
      <GoogleLoginButton enabled getIdToken={vi.fn().mockResolvedValue('id-token-1')} />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Continue with Google' }))
    expect(await screen.findByText('Google login unavailable')).toBeDefined()
  })
})
