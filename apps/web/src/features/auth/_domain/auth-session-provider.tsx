import { createContext, useContext, useMemo, useReducer } from 'react'

import type { AuthUser } from './auth-client'
import {
  initialAuthSessionState,
  reduceAuthSessionState,
} from './auth-session-state'
import type { AuthSessionState } from './auth-types'

export type AuthSessionActions = {
  setAuthenticated: (payload: { accessToken: string; user: AuthUser }) => void
  setAnonymous: () => void
  setUnknown: () => void
}

const AuthSessionStateContext = createContext<AuthSessionState | null>(null)
const AuthSessionActionsContext = createContext<AuthSessionActions | null>(null)

export function AuthSessionProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(
    reduceAuthSessionState,
    initialAuthSessionState,
  )

  const actions = useMemo<AuthSessionActions>(
    () => ({
      setAuthenticated: ({ accessToken, user }) =>
        dispatch({ type: 'authenticated', accessToken, user }),
      setAnonymous: () => dispatch({ type: 'anonymous' }),
      setUnknown: () => dispatch({ type: 'unknown' }),
    }),
    [],
  )

  return (
    <AuthSessionActionsContext.Provider value={actions}>
      <AuthSessionStateContext.Provider value={state}>
        {children}
      </AuthSessionStateContext.Provider>
    </AuthSessionActionsContext.Provider>
  )
}

export function useAuthSessionState() {
  const state = useContext(AuthSessionStateContext)

  if (!state) {
    throw new Error('useAuthSessionState must be used inside AuthSessionProvider')
  }

  return state
}

export function useAuthSessionActions() {
  const actions = useContext(AuthSessionActionsContext)

  if (!actions) {
    throw new Error('useAuthSessionActions must be used inside AuthSessionProvider')
  }

  return actions
}
