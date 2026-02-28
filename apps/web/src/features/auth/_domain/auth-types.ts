export type RegisterRequest = {
  email: string;
  name: string;
  password: string;
  confirmedPassword: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
};

export type UnknownAuthSessionState = {
  status: 'unknown';
};

export type AuthenticatedSessionState = {
  status: 'authenticated';
  accessToken: string;
  user: AuthUser;
};

export type AnonymousAuthSessionState = {
  status: 'anonymous';
};

export type AuthSessionState =
  | UnknownAuthSessionState
  | AuthenticatedSessionState
  | AnonymousAuthSessionState;
