import type { AuthSessionState, AuthUser } from './auth-types';

export const initialAuthSessionState: AuthSessionState = { status: 'unknown' };

export type AuthSessionAction =
  | { type: 'unknown' }
  | { type: 'anonymous' }
  | {
      type: 'authenticated';
      accessToken: string;
      user: AuthUser;
    };

export function reduceAuthSessionState(
  _state: AuthSessionState,
  action: AuthSessionAction,
): AuthSessionState {
  if (action.type === 'unknown') {
    return { status: 'unknown' };
  }

  if (action.type === 'anonymous') {
    return { status: 'anonymous' };
  }

  return {
    status: 'authenticated',
    accessToken: action.accessToken,
    user: action.user,
  };
}
