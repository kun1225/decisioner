import { createFileRoute, Outlet } from '@tanstack/react-router';

import { DashboardLayout } from '@/components/dashboard-layout';
import { requireAuthenticatedRoute } from '@/features/auth/_domain/require-authenticated-route';

export const Route = createFileRoute('/dashboard')({
  beforeLoad: async ({ context, location }) =>
    requireAuthenticatedRoute({ context, location }),
  component: DashboardLayoutRoute,
});

function DashboardLayoutRoute() {
  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
}
