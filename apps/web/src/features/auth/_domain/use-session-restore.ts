import { useCallback } from 'react'

import { me, refresh } from './auth-api'
import { isUnauthorizedError } from './auth-errors'
import { useAuthSession } from './auth-session-store'
import { clearAccessToken, getAccessToken, setAccessToken } from './token-storage'
import type { AuthUser } from './auth-types'

type RestoreDependencies = {
  readAccessToken: () => string | null
  saveAccessToken: (accessToken: string) => void
  clearAccessToken: () => void
  fetchMe: (accessToken: string) => Promise<AuthUser>
  refreshToken: () => Promise<{ accessToken: string }>
}

export type RestoreResult =
  | { status: 'authenticated'; accessToken: string; user: AuthUser }
  | { status: 'guest' }

const defaultDependencies: RestoreDependencies = {
  readAccessToken: getAccessToken,
  saveAccessToken: setAccessToken,
  clearAccessToken,
  fetchMe: me,
  refreshToken: refresh,
}

async function restoreFromRefreshToken(
  dependencies: RestoreDependencies,
): Promise<RestoreResult> {
  try {
    const nextToken = await dependencies.refreshToken()
    dependencies.saveAccessToken(nextToken.accessToken)
    const user = await dependencies.fetchMe(nextToken.accessToken)

    return {
      status: 'authenticated',
      accessToken: nextToken.accessToken,
      user,
    }
  } catch {
    dependencies.clearAccessToken()
    return { status: 'guest' }
  }
}

export async function restoreAuthSession(
  dependencies: RestoreDependencies,
): Promise<RestoreResult> {
  const existingToken = dependencies.readAccessToken()

  if (existingToken) {
    try {
      const user = await dependencies.fetchMe(existingToken)
      return {
        status: 'authenticated',
        accessToken: existingToken,
        user,
      }
    } catch (error) {
      if (!isUnauthorizedError(error)) {
        throw error
      }
    }
  }

  return restoreFromRefreshToken(dependencies)
}

export function useSessionRestore() {
  const { setAuthenticated, setGuest, setRestoring } = useAuthSession()

  return useCallback(async () => {
    setRestoring()

    const result = await restoreAuthSession(defaultDependencies)

    if (result.status === 'authenticated') {
      setAuthenticated({
        accessToken: result.accessToken,
        user: result.user,
      })
      return result
    }

    setGuest()
    return result
  }, [setAuthenticated, setGuest, setRestoring])
}
