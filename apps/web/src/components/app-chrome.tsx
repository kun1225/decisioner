import { useNavigate, useRouterState } from '@tanstack/react-router';
import type { ReactNode } from 'react';

import { useAuthSessionState } from '@/features/auth/_domain/auth-session-provider';

import { AppHeader } from './app-header';
import { DashboardSidebar } from './dashboard-sidebar';

type AppChromeProps = {
  children: ReactNode;
};

export function AppChrome({ children }: AppChromeProps) {
  const location = useRouterState({ select: (state) => state.location });
  const navigate = useNavigate();
  const authSession = useAuthSessionState();

  const isAuthenticated = authSession.status === 'authenticated';
  const isDashboardRoute = location.pathname.startsWith('/dashboard');
  const redirectTarget = `${location.pathname}${location.searchStr}${location.hash}`;
  const headerLogoHref = '/';
  const headerPrimaryHref = isAuthenticated
    ? '/dashboard'
    : `/auth/login?redirect=${encodeURIComponent(redirectTarget)}`;

  const runNavigation = (
    payload:
      | { to: '/' | '/dashboard' }
      | {
          to: '/auth/login';
          search: {
            redirect: string;
          };
        },
  ) => {
    Promise.resolve(navigate(payload as never)).catch(() => {});
  };

  const navigateToHome = () => {
    runNavigation({ to: '/' });
  };

  const navigateToDashboard = () => {
    runNavigation({ to: '/dashboard' });
  };

  const navigateToLogin = (redirect: string) => {
    runNavigation({
      to: '/auth/login',
      search: {
        redirect,
      },
    });
  };

  const handleSidebarAuthAction = () => {
    if (isAuthenticated) {
      navigateToHome();
      return;
    }

    navigateToLogin('/dashboard');
  };

  if (isDashboardRoute) {
    return (
      <div className="grid min-h-screen lg:grid-cols-[240px_1fr]">
        <DashboardSidebar
          isAuthenticated={isAuthenticated}
          onBrandClick={navigateToDashboard}
          onDashboardClick={navigateToDashboard}
          onAuthActionClick={handleSidebarAuthAction}
        />
        <div>{children}</div>
      </div>
    );
  }

  return (
    <>
      <AppHeader
        isAuthenticated={isAuthenticated}
        logoHref={headerLogoHref}
        primaryHref={headerPrimaryHref}
      />
      <div>{children}</div>
    </>
  );
}
