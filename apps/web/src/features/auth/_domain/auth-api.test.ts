import { afterEach, describe, expect, it, vi } from 'vitest'

import type { LoginInput, RegisterInput } from '@repo/shared/auth'

import { createFetchResponse } from '@/lib/mock-fetch'

import { login, logout, me, refresh, register } from './auth-api'
import { AuthApiError } from './auth-errors'

const originalFetch = globalThis.fetch

describe('auth-api', () => {
  afterEach(() => {
    globalThis.fetch = originalFetch
    vi.restoreAllMocks()
  })

  it('posts register payload with cookie credentials', async () => {
    const payload: RegisterInput = {
      email: 'joy@example.com',
      name: 'Joy',
      password: 'Strong@123',
      confirmedPassword: 'Strong@123',
    }

    const fetchSpy = vi.fn().mockResolvedValue(
      createFetchResponse({
        accessToken: 'token-1',
        user: {
          id: 'u-1',
          email: 'joy@example.com',
          name: 'Joy',
        },
      }),
    )
    globalThis.fetch = fetchSpy as typeof fetch

    const result = await register(payload)

    expect(fetchSpy).toHaveBeenCalledTimes(1)
    const [url, options] = fetchSpy.mock.calls[0]
    expect(String(url)).toContain('/api/auth/register')
    expect(options?.credentials).toBe('include')
    expect(options?.method).toBe('POST')
    expect(result.accessToken).toBe('token-1')
  })

  it('posts login payload and returns access token', async () => {
    const payload: LoginInput = {
      email: 'joy@example.com',
      password: 'Strong@123',
    }

    const fetchSpy = vi.fn().mockResolvedValue(
      createFetchResponse({ accessToken: 'token-2' }),
    )
    globalThis.fetch = fetchSpy as typeof fetch

    const result = await login(payload)

    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(result.accessToken).toBe('token-2')
  })

  it('sends bearer token when requesting current user', async () => {
    const fetchSpy = vi.fn().mockResolvedValue(
      createFetchResponse({
        id: 'u-1',
        email: 'joy@example.com',
        name: 'Joy',
      }),
    )
    globalThis.fetch = fetchSpy as typeof fetch

    const user = await me('access-1')

    const [, options] = fetchSpy.mock.calls[0]
    const headers = options?.headers as Record<string, string>
    expect(headers.Authorization).toBe('Bearer access-1')
    expect(user.email).toBe('joy@example.com')
  })

  it('maps api failure into AuthApiError', async () => {
    const fetchSpy = vi
      .fn()
      .mockResolvedValue(createFetchResponse({ error: 'Unauthorized' }, { status: 401 }))
    globalThis.fetch = fetchSpy as typeof fetch

    const result = refresh()
    await expect(result).rejects.toBeInstanceOf(AuthApiError)
    await expect(result).rejects.toMatchObject({
      status: 401,
      message: 'Unauthorized',
    })
  })

  it('calls logout endpoint with cookie credentials', async () => {
    const fetchSpy = vi.fn().mockResolvedValue(createFetchResponse({}, { status: 204 }))
    globalThis.fetch = fetchSpy as typeof fetch

    await logout()

    const [url, options] = fetchSpy.mock.calls[0]
    expect(String(url)).toContain('/api/auth/logout')
    expect(options?.credentials).toBe('include')
    expect(options?.method).toBe('POST')
  })
})
