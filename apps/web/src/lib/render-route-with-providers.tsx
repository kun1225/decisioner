import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router';
import { render } from '@testing-library/react';

export function renderRouteWithProviders(options: {
  path: string;
  component: React.ComponentType;
}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const rootRoute = createRootRoute({
    component: () => <Outlet />,
  });

  const pageRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: options.path,
    component: options.component,
  });

  const router = createRouter({
    routeTree: rootRoute.addChildren([pageRoute]),
    history: createMemoryHistory({
      initialEntries: [options.path],
    }),
  });

  const rendered = render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );

  return {
    ...rendered,
    queryClient,
    router,
  };
}
