import { createContext, useContext, useMemo, useState } from 'react'

import type { AuthSession, AuthStatus, AuthUser } from './auth-types'

export type AuthSessionState = {
  status: AuthStatus
  user: AuthUser | null
  accessToken: string | null
}

type AuthSessionStoreValue = {
  state: AuthSessionState
  setRestoring: () => void
  setAuthenticated: (session: AuthSession) => void
  setGuest: () => void
}

const AuthSessionContext = createContext<AuthSessionStoreValue | null>(null)

const initialState: AuthSessionState = {
  status: 'idle',
  user: null,
  accessToken: null,
}

export function AuthSessionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthSessionState>(initialState)

  const value = useMemo<AuthSessionStoreValue>(
    () => ({
      state,
      setRestoring: () => {
        setState((previous) => ({
          ...previous,
          status: 'restoring',
        }))
      },
      setAuthenticated: (session) => {
        setState({
          status: 'authenticated',
          user: session.user,
          accessToken: session.accessToken,
        })
      },
      setGuest: () => {
        setState({
          status: 'guest',
          user: null,
          accessToken: null,
        })
      },
    }),
    [state],
  )

  return <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>
}

export function useAuthSession(): AuthSessionStoreValue {
  const context = useContext(AuthSessionContext)

  if (!context) {
    throw new Error('useAuthSession must be used within AuthSessionProvider')
  }

  return context
}
