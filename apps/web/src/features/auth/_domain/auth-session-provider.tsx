import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from 'react';

import { AuthApiError, me, refresh } from './auth-client';
import type { AuthSessionState, AuthUser } from './auth-types';

// --- Reducer ---

type AuthSessionAction =
  | { type: 'unknown' }
  | { type: 'anonymous' }
  | { type: 'error'; reason: 'restore-failed' }
  | {
      type: 'authenticated';
      accessToken: string;
      user: AuthUser;
    };

const initialAuthSessionState: AuthSessionState = { status: 'unknown' };

function reduceAuthSessionState(
  _state: AuthSessionState,
  action: AuthSessionAction,
): AuthSessionState {
  if (action.type === 'unknown') {
    return { status: 'unknown' };
  }

  if (action.type === 'anonymous') {
    return { status: 'anonymous' };
  }

  if (action.type === 'error') {
    return { status: 'error', reason: action.reason };
  }

  return {
    status: 'authenticated',
    accessToken: action.accessToken,
    user: action.user,
  };
}

// --- Session Restore ---

type RestoreActions = Pick<
  AuthSessionActions,
  'setAuthenticated' | 'setAnonymous' | 'setError'
>;

function useSessionRestore(actions: RestoreActions) {
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    async function restoreSession() {
      try {
        const { accessToken } = await refresh();
        const user = await me(accessToken);

        actions.setAuthenticated({ accessToken, user });
      } catch (error) {
        if (
          error instanceof AuthApiError &&
          (error.status === 401 || error.status === 403)
        ) {
          actions.setAnonymous();
          return;
        }

        actions.setError();
        return;
      }
    }

    void restoreSession();
  }, [actions]);
}

// --- Provider ---

export type AuthSessionActions = {
  setAuthenticated: (payload: { accessToken: string; user: AuthUser }) => void;
  setAnonymous: () => void;
  setUnknown: () => void;
  setError: () => void;
};

type AuthSessionProviderProps = {
  children: React.ReactNode;
  onStateChange?: (state: AuthSessionState) => void;
};

const AuthSessionStateContext = createContext<AuthSessionState | null>(null);
const AuthSessionActionsContext = createContext<AuthSessionActions | null>(
  null,
);

export function AuthSessionProvider({
  children,
  onStateChange,
}: AuthSessionProviderProps) {
  const [state, dispatch] = useReducer(
    reduceAuthSessionState,
    initialAuthSessionState,
  );

  const actions = useMemo<AuthSessionActions>(
    () => ({
      setAuthenticated: ({ accessToken, user }) =>
        dispatch({ type: 'authenticated', accessToken, user }),
      setAnonymous: () => dispatch({ type: 'anonymous' }),
      setUnknown: () => dispatch({ type: 'unknown' }),
      setError: () => dispatch({ type: 'error', reason: 'restore-failed' }),
    }),
    [],
  );

  useSessionRestore(actions);

  useEffect(() => {
    onStateChange?.(state);
  }, [state, onStateChange]);

  return (
    <AuthSessionActionsContext.Provider value={actions}>
      <AuthSessionStateContext.Provider value={state}>
        {children}
      </AuthSessionStateContext.Provider>
    </AuthSessionActionsContext.Provider>
  );
}

export function useAuthSessionState() {
  const state = useContext(AuthSessionStateContext);

  if (!state) {
    throw new Error(
      'useAuthSessionState must be used inside AuthSessionProvider',
    );
  }

  return state;
}

export function useAuthSessionActions() {
  const actions = useContext(AuthSessionActionsContext);

  if (!actions) {
    throw new Error(
      'useAuthSessionActions must be used inside AuthSessionProvider',
    );
  }

  return actions;
}
