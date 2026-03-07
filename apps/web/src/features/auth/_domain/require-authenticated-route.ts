import { redirect } from '@tanstack/react-router';

import type { AuthSessionState } from './auth-types';
import { checkSessionPresence } from './check-session-presence';

type RequireAuthenticatedRouteOptions = {
  context: {
    getAuthSessionState: () => AuthSessionState;
    waitForAuthReady: () => Promise<void>;
  };
  location: {
    href: string;
  };
};

type RequireAuthenticatedRouteDeps = {
  checkSessionPresence: () => Promise<boolean>;
  isServer: () => boolean;
  redirectToLogin: (locationHref: string) => never;
};

const defaultDeps: RequireAuthenticatedRouteDeps = {
  checkSessionPresence,
  isServer: () => typeof window === 'undefined',
  redirectToLogin: (locationHref) => {
    throw redirect({
      to: '/auth/login',
      search: { redirect: locationHref },
    });
  },
};

export async function requireAuthenticatedRoute(
  { context, location }: RequireAuthenticatedRouteOptions,
  deps: RequireAuthenticatedRouteDeps = defaultDeps,
) {
  if (deps.isServer()) {
    let hasPresence = false;

    try {
      hasPresence = await deps.checkSessionPresence();
    } catch {
      hasPresence = false;
    }

    if (!hasPresence) {
      deps.redirectToLogin(location.href);
    }

    return;
  }

  if (context.getAuthSessionState().status === 'unknown') {
    await context.waitForAuthReady();
  }

  if (context.getAuthSessionState().status !== 'authenticated') {
    deps.redirectToLogin(location.href);
  }
}
