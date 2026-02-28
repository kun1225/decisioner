import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  AuthApiError,
  login,
  logout,
  me,
  refresh,
  register,
} from './auth-client'

describe('auth-client request contract', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    fetchMock.mockReset()
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

  it('calls refresh and logout endpoints with include credentials', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ accessToken: 'rotated' }),
      })
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) })

    await refresh()
    await logout()

    expect(fetchMock).toHaveBeenNthCalledWith(1, '/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
    })
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    })
  })

  it('calls me endpoint with bearer token', async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'u1' }) })

    await me('access-token')

    expect(fetchMock).toHaveBeenCalledWith('/api/auth/me', {
      method: 'GET',
      credentials: 'include',
      headers: { Authorization: 'Bearer access-token' },
    })
  })

  it('throws AuthApiError when response is not ok', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Invalid email or password' }),
    })

    await expect(login({ email: 'joy@example.com', password: 'bad' })).rejects.toEqual(
      new AuthApiError(401, 'Invalid email or password'),
    )
  })
})
