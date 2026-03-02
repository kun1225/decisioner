import { createRouter } from '@tanstack/react-router';
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query';

import { AuthSessionProvider } from '@/features/auth/_domain/auth-session-provider';

import * as AppProviders from './providers';
// Import the generated route tree
import { routeTree } from './routeTree.gen';

// Create a new router instance
export const getRouter = () => {
  const rqContext = AppProviders.getContext();

  const router = createRouter({
    routeTree,
    context: {
      ...rqContext,
    },
    Wrap: ({ children }) => <AuthSessionProvider>{children}</AuthSessionProvider>,
    defaultPreload: 'intent',
  });

  setupRouterSsrQueryIntegration({
    router,
    queryClient: rqContext.queryClient,
  });

  return router;
};
