import { useNavigate } from '@tanstack/react-router';
import type { ReactNode } from 'react';

import { useAuthSessionState } from '@/features/auth/_domain/auth-session-provider';
import { useLogout } from '@/features/auth/_domain/use-logout';

import { DashboardSidebar } from './dashboard-sidebar';

type DashboardLayoutProps = {
  children: ReactNode;
};

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const navigate = useNavigate();
  const authSession = useAuthSessionState();
  const { handleLogout } = useLogout();

  const userName =
    authSession.status === 'authenticated'
      ? authSession.user.name
      : undefined;

  const navigateToDashboard = () => {
    Promise.resolve(navigate({ to: '/dashboard' } as never)).catch(() => {});
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[240px_1fr]">
      <DashboardSidebar
        userName={userName}
        onBrandClick={navigateToDashboard}
        onDashboardClick={navigateToDashboard}
        onLogout={handleLogout}
      />
      <div>{children}</div>
    </div>
  );
}
