import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

import { DashboardLayout } from '@/components/dashboard-layout';
import { checkSessionPresence } from '@/features/auth/_domain/check-session-presence';

export const Route = createFileRoute('/dashboard')({
  beforeLoad: async ({ context, location }) => {
    // --- Server: check session_presence cookie (fail-closed) ---
    if (typeof window === 'undefined') {
      let hasPresence = false;
      try {
        hasPresence = await checkSessionPresence();
      } catch {
        // getCookie failure → fail-closed
      }

      if (!hasPresence) {
        throw redirect({
          to: '/auth/login',
          search: { redirect: location.href },
        });
      }

      return;
    }

    // --- Client: full auth state verification ---
    if (context.getAuthSessionState().status === 'unknown') {
      await context.waitForAuthReady();
    }

    if (context.getAuthSessionState().status !== 'authenticated') {
      throw redirect({
        to: '/auth/login',
        search: { redirect: location.href },
      });
    }
  },
  component: DashboardLayoutRoute,
});

function DashboardLayoutRoute() {
  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
}
