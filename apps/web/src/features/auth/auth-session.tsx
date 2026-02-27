import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

type AuthUser = {
  id: string
  email: string
  name: string
}

export type SessionStatus = 'unknown' | 'authenticated' | 'anonymous'

type AuthSession = {
  status: SessionStatus
  accessToken: string | null
  user: AuthUser | null
  setAuthenticated: (input: { accessToken: string; user: AuthUser }) => void
  setAnonymous: () => void
  setUnknown: () => void
}

const AuthSessionContext = createContext<AuthSession | null>(null)

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SessionStatus>('unknown')
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [user, setUser] = useState<AuthUser | null>(null)

  const setAuthenticated = useCallback(
    (input: { accessToken: string; user: AuthUser }) => {
      setStatus('authenticated')
      setAccessToken(input.accessToken)
      setUser(input.user)
    },
    [],
  )

  const setAnonymous = useCallback(() => {
    setStatus('anonymous')
    setAccessToken(null)
    setUser(null)
  }, [])

  const setUnknown = useCallback(() => {
    setStatus('unknown')
    setAccessToken(null)
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      status,
      accessToken,
      user,
      setAuthenticated,
      setAnonymous,
      setUnknown,
    }),
    [accessToken, setAnonymous, setAuthenticated, setUnknown, status, user],
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
    throw new Error('useAuthSession must be used within AuthSessionProvider')
  }

  return context
}
