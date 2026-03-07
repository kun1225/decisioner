import { TanStackDevtools } from '@tanstack/react-devtools';
import type { QueryClient } from '@tanstack/react-query';
import {
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from '@tanstack/react-router';
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools';

import type { AuthSessionState } from '@/features/auth/_domain/auth-types';

import TanStackQueryDevtools from '../integrations/tanstack-query/devtools';
import appCss from '../styles.css?url';

type MyRouterContext = {
  queryClient: QueryClient;
  getAuthSessionState: () => AuthSessionState;
  waitForAuthReady: () => Promise<void>;
};

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'TanStack Start Starter',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
  notFoundComponent: () => (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-2xl font-semibold">Page not found</h1>
      <p className="text-muted-foreground mt-2">
        The page you requested does not exist.
      </p>
      <a href="/" className="text-primary mt-4 inline-block underline">
        Back to home
      </a>
    </main>
  ),
});

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
            TanStackQueryDevtools,
          ]}
        />
        <Scripts />
      </body>
    </html>
  );
}
