import { createFileRoute, Outlet } from '@tanstack/react-router';

import { FrontendLayout } from '@/components/frontend-layout';

export const Route = createFileRoute('/_frontend')({
  component: FrontendLayoutRoute,
});

function FrontendLayoutRoute() {
  return (
    <FrontendLayout>
      <Outlet />
    </FrontendLayout>
  );
}
