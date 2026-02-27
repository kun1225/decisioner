// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const navigateMock = vi.fn()
const setAuthenticatedMock = vi.fn()
const loginMock = vi.fn()
const meMock = vi.fn()

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>()
  return {
    ...actual,
    useNavigate: () => navigateMock,
    useSearch: () => ({ redirect: '/train/start' }),
  }
})

vi.mock('@/features/auth/auth-session', () => ({
  useAuthSession: () => ({ setAuthenticated: setAuthenticatedMock }),
}))

vi.mock('@/features/auth/api-client', () => ({
  login: loginMock,
  me: meMock,
}))

import { LoginPage } from './login'

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows field validation errors', async () => {
    render(<LoginPage />)

    fireEvent.click(screen.getByRole('button', { name: 'Login' }))

    await waitFor(() => {
      expect(screen.getByText('Invalid email address')).toBeTruthy()
      expect(screen.getByText('Password is required')).toBeTruthy()
    })
  })

  it('logs in and redirects on success', async () => {
    loginMock.mockResolvedValue({ accessToken: 'token-1' })
    meMock.mockResolvedValue({ id: 'u1', email: 'a@b.com', name: 'A' })

    render(<LoginPage />)

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'a@b.com' },
    })
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'Password!1' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Login' }))

    await waitFor(() => {
      expect(setAuthenticatedMock).toHaveBeenCalledWith({
        accessToken: 'token-1',
        user: { id: 'u1', email: 'a@b.com', name: 'A' },
      })
      expect(navigateMock).toHaveBeenCalledWith({ to: '/train/start' })
    })
  })

  it('shows API error message', async () => {
    loginMock.mockRejectedValue(new Error('Invalid email or password'))

    render(<LoginPage />)

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'a@b.com' },
    })
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'wrong' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Login' }))

    await waitFor(() => {
      expect(screen.getByText('Invalid email or password')).toBeTruthy()
    })
  })
})
