import { useRouterState } from '@tanstack/react-router';
import type { ReactNode } from 'react';

import { useAuthSessionState } from '@/features/auth/_domain/auth-session-provider';

import { AppHeader } from './app-header';

type FrontendLayoutProps = {
  children: ReactNode;
};

export function FrontendLayout({ children }: FrontendLayoutProps) {
  const location = useRouterState({ select: (state) => state.location });
  const authSession = useAuthSessionState();

  const isAuthenticated = authSession.status === 'authenticated';
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
        isAuthenticated={isAuthenticated}
        logoHref="/"
        primaryHref={primaryHref}
      />
      <div>{children}</div>
    </>
  );
}
