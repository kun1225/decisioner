import { createRouter } from '@tanstack/react-router';
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query';

import * as AppProviders from './providers';
// Import the generated route tree
import { routeTree } from './routeTree.gen';

// Create a new router instance
export const getRouter = () => {
  const context = AppProviders.getContext();

  const router = createRouter({
    routeTree,
    context,
    Wrap: ({ children }) => (
      <AppProviders.Provider context={context}>
        {children}
      </AppProviders.Provider>
    ),
    defaultPreload: 'intent',
  });

  setupRouterSsrQueryIntegration({
    router,
    queryClient: context.queryClient,
  });

  return router;
};
