import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { login, register } from './auth-client'

describe('auth-client request contract', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('calls register endpoint with include credentials and json body', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ accessToken: 'token', user: { id: 'u1' } }),
    })

    await register({
      email: 'joy@example.com',
      name: 'Joy',
      password: 'Passw0rd!',
      confirmedPassword: 'Passw0rd!',
    })

    expect(fetchMock).toHaveBeenCalledWith('/api/auth/register', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'joy@example.com',
        name: 'Joy',
        password: 'Passw0rd!',
        confirmedPassword: 'Passw0rd!',
      }),
    })
  })

  it('calls login endpoint with include credentials and json body', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ accessToken: 'token' }),
    })

    await login({ email: 'joy@example.com', password: 'Passw0rd!' })

    expect(fetchMock).toHaveBeenCalledWith('/api/auth/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'joy@example.com', password: 'Passw0rd!' }),
    })
  })
})
