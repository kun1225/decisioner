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

  const primaryHref = isAuthenticated
    ? '/dashboard'
    : isAuthRoute
      ? '/auth/login'
      : `/auth/login?redirect=${encodeURIComponent(`${location.pathname}${location.searchStr}${location.hash}`)}`;

  return (
    <>
      <AppHeader logoHref="/" primaryHref={primaryHref} />
      <div>{children}</div>
    </>
  );
}
