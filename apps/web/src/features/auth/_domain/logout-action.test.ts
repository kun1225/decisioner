import { describe, expect, it, vi } from 'vitest'

import { performLogout } from './logout-action'

describe('performLogout', () => {
  it('calls api logout and clears local session state', async () => {
    const logoutRequest = vi.fn().mockResolvedValue(undefined)
    const clearAccessToken = vi.fn()
    const setGuest = vi.fn()

    await performLogout({
      logoutRequest,
      clearAccessToken,
      setGuest,
    })

    expect(logoutRequest).toHaveBeenCalledTimes(1)
    expect(clearAccessToken).toHaveBeenCalledTimes(1)
    expect(setGuest).toHaveBeenCalledTimes(1)
  })

  it('still clears local session when api logout fails', async () => {
    const logoutRequest = vi.fn().mockRejectedValue(new Error('network'))
    const clearAccessToken = vi.fn()
    const setGuest = vi.fn()

    await performLogout({
      logoutRequest,
      clearAccessToken,
      setGuest,
    })

    expect(clearAccessToken).toHaveBeenCalledTimes(1)
    expect(setGuest).toHaveBeenCalledTimes(1)
  })

  it('clears token before switching guest state', async () => {
    const clearAccessToken = vi.fn()
    const setGuest = vi.fn()

    await performLogout({
      logoutRequest: vi.fn().mockResolvedValue(undefined),
      clearAccessToken,
      setGuest,
    })

    expect(clearAccessToken.mock.invocationCallOrder[0]).toBeLessThan(
      setGuest.mock.invocationCallOrder[0],
    )
  })
})
