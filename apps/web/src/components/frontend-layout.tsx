import { useRouterState } from '@tanstack/react-router';
import type { ReactNode } from 'react';

import { useAuthSessionState } from '@/features/auth/_domain/auth-session-provider';
import { useLogout } from '@/features/auth/_domain/use-logout';

import { AppHeader } from './app-header';

type FrontendLayoutProps = {
  children: ReactNode;
};

export function FrontendLayout({ children }: FrontendLayoutProps) {
  const location = useRouterState({ select: (state) => state.location });
  const authSession = useAuthSessionState();
  const { handleLogout } = useLogout();

  const isAuthenticated = authSession.status === 'authenticated';
  const userName = isAuthenticated ? authSession.user.name : undefined;
  const isAuthRoute = location.pathname.startsWith('/auth/');
  const redirectTarget = `${location.pathname}${location.searchStr}${location.hash}`;
  const redirectFromAuthSearch = new URLSearchParams(location.searchStr).get(
    'redirect',
  );
  const safeAuthRedirect =
    redirectFromAuthSearch && redirectFromAuthSearch.startsWith('/')
      ? redirectFromAuthSearch
      : undefined;
  const primaryHref = isAuthenticated
    ? '/dashboard'
    : isAuthRoute
      ? safeAuthRedirect
        ? `/auth/login?redirect=${encodeURIComponent(safeAuthRedirect)}`
        : '/auth/login'
      : `/auth/login?redirect=${encodeURIComponent(redirectTarget)}`;

  return (
    <>
      <AppHeader
        authStatus={authSession.status}
        userName={userName}
        logoHref="/"
        primaryHref={primaryHref}
        onLogout={handleLogout}
      />
      <div>{children}</div>
    </>
  );
}
