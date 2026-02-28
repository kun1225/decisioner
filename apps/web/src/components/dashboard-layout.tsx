import { useNavigate } from '@tanstack/react-router';
import type { ReactNode } from 'react';

import { useAuthSessionState } from '@/features/auth/_domain/auth-session-provider';

import { DashboardSidebar } from './dashboard-sidebar';

type DashboardLayoutProps = {
  children: ReactNode;
};

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const navigate = useNavigate();
  const authSession = useAuthSessionState();

  const isAuthenticated = authSession.status === 'authenticated';

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
