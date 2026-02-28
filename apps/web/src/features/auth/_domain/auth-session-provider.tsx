import { createContext, useContext, useMemo, useReducer } from 'react'

import type { AuthUser } from './auth-client'
import {
  initialAuthSessionState,
  reduceAuthSessionState,
} from './auth-session-state'
import type { AuthSessionState } from './auth-types'

type AuthSessionActions = {
  setAuthenticated: (payload: { accessToken: string; user: AuthUser }) => void
  setAnonymous: () => void
  setUnknown: () => void
}

export type AuthSessionContextValue = {
  state: AuthSessionState
  actions: AuthSessionActions
}

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null)

export function AuthSessionProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(
    reduceAuthSessionState,
    initialAuthSessionState,
  )

  const value = useMemo<AuthSessionContextValue>(
    () => ({
      state,
      actions: {
        setAuthenticated: ({ accessToken, user }) =>
          dispatch({ type: 'authenticated', accessToken, user }),
        setAnonymous: () => dispatch({ type: 'anonymous' }),
        setUnknown: () => dispatch({ type: 'unknown' }),
      },
    }),
    [state],
  )

  return (
    <AuthSessionContext.Provider value={value}>
      {children}
    </AuthSessionContext.Provider>
  )
}

export function useAuthSession() {
  const context = useContext(AuthSessionContext)

  if (!context) {
    throw new Error('useAuthSession must be used inside AuthSessionProvider')
  }

  return context
}
