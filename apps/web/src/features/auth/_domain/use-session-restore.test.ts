import { describe, expect, it, vi } from 'vitest'

import { AuthApiError } from './auth-errors'
import { restoreAuthSession } from './use-session-restore'

describe('restoreAuthSession', () => {
  it('uses existing token when /me succeeds', async () => {
    const fetchMe = vi.fn().mockResolvedValue({
      id: 'u-1',
      email: 'joy@example.com',
      name: 'Joy',
    })
    const refreshToken = vi.fn()
    const readAccessToken = vi.fn().mockReturnValue('token-1')

    const result = await restoreAuthSession({
      readAccessToken,
      saveAccessToken: vi.fn(),
      clearAccessToken: vi.fn(),
      fetchMe,
      refreshToken,
    })

    expect(refreshToken).not.toHaveBeenCalled()
    expect(fetchMe).toHaveBeenCalledWith('token-1')
    expect(result).toMatchObject({
      status: 'authenticated',
      accessToken: 'token-1',
      user: { email: 'joy@example.com' },
    })
  })

  it('refreshes token when existing token is unauthorized', async () => {
    const fetchMe = vi
      .fn()
      .mockRejectedValueOnce(
        new AuthApiError({
          status: 401,
          code: 'UNAUTHENTICATED',
          message: 'expired',
        }),
      )
      .mockResolvedValueOnce({
        id: 'u-1',
        email: 'joy@example.com',
        name: 'Joy',
      })
    const refreshToken = vi.fn().mockResolvedValue({ accessToken: 'token-2' })
    const saveAccessToken = vi.fn()

    const result = await restoreAuthSession({
      readAccessToken: vi.fn().mockReturnValue('token-1'),
      saveAccessToken,
      clearAccessToken: vi.fn(),
      fetchMe,
      refreshToken,
    })

    expect(refreshToken).toHaveBeenCalledTimes(1)
    expect(saveAccessToken).toHaveBeenCalledWith('token-2')
    expect(fetchMe).toHaveBeenNthCalledWith(2, 'token-2')
    expect(result).toMatchObject({
      status: 'authenticated',
      accessToken: 'token-2',
    })
  })

  it('returns guest and clears token when refresh fails', async () => {
    const clearAccessToken = vi.fn()

    const result = await restoreAuthSession({
      readAccessToken: vi.fn().mockReturnValue('token-1'),
      saveAccessToken: vi.fn(),
      clearAccessToken,
      fetchMe: vi.fn().mockRejectedValue(
        new AuthApiError({
          status: 401,
          code: 'UNAUTHENTICATED',
          message: 'expired',
        }),
      ),
      refreshToken: vi.fn().mockRejectedValue(
        new AuthApiError({
          status: 401,
          code: 'UNAUTHENTICATED',
          message: 'revoked',
        }),
      ),
    })

    expect(clearAccessToken).toHaveBeenCalledTimes(1)
    expect(result).toEqual({ status: 'guest' })
  })
})
