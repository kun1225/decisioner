import type { AuthUser } from './auth-client'

export type UnknownAuthSessionState = {
  status: 'unknown'
}

export type AuthenticatedSessionState = {
  status: 'authenticated'
  accessToken: string
  user: AuthUser
}

export type AnonymousAuthSessionState = {
  status: 'anonymous'
}

export type AuthSessionState =
  | UnknownAuthSessionState
  | AuthenticatedSessionState
  | AnonymousAuthSessionState
