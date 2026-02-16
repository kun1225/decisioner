import { fireEvent, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '@/lib/render-with-providers'

import { RegisterForm } from './register-form'

const registerMock = vi.fn()
const setAccessTokenMock = vi.fn()

vi.mock('../_domain/auth-api', () => ({
  register: (...args: Array<unknown>) => registerMock(...args),
}))

vi.mock('../_domain/token-storage', () => ({
  setAccessToken: (...args: Array<unknown>) => setAccessTokenMock(...args),
}))

describe('register-form', () => {
  beforeEach(() => {
    registerMock.mockReset()
    setAccessTokenMock.mockReset()
  })

  it('shows schema validation message for mismatched passwords', async () => {
    renderWithProviders(<RegisterForm />)

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'joy@example.com' },
    })
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Joy' } })
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'Strong@123' },
    })
    fireEvent.change(screen.getByLabelText('Confirm Password'), {
      target: { value: 'Strong@124' },
    })
    fireEvent.submit(screen.getByRole('button', { name: 'Create Account' }))

    expect(await screen.findByText('Passwords do not match')).toBeDefined()
    expect(registerMock).not.toHaveBeenCalled()
  })

  it('submits register payload and forwards onSuccess', async () => {
    registerMock.mockResolvedValue({ accessToken: 'token-2' })
    const onSuccess = vi.fn()

    renderWithProviders(<RegisterForm onSuccess={onSuccess} />)

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'joy@example.com' },
    })
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Joy' } })
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'Strong@123' },
    })
    fireEvent.change(screen.getByLabelText('Confirm Password'), {
      target: { value: 'Strong@123' },
    })
    fireEvent.submit(screen.getByRole('button', { name: 'Create Account' }))

    await waitFor(() => {
      expect(registerMock).toHaveBeenCalledTimes(1)
    })
    expect(setAccessTokenMock).toHaveBeenCalledWith('token-2')
    expect(onSuccess).toHaveBeenCalledWith('token-2')
  })

  it('shows api failure message', async () => {
    registerMock.mockRejectedValue(new Error('Email already registered'))

    renderWithProviders(<RegisterForm />)

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'joy@example.com' },
    })
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Joy' } })
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'Strong@123' },
    })
    fireEvent.change(screen.getByLabelText('Confirm Password'), {
      target: { value: 'Strong@123' },
    })
    fireEvent.submit(screen.getByRole('button', { name: 'Create Account' }))

    expect(await screen.findByText('Email already registered')).toBeDefined()
  })
})
