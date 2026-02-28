import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { AuthSessionProvider } from '@/features/auth/_domain/auth-session-provider';

export function getContext() {
  const queryClient = new QueryClient();
  return {
    queryClient,
  };
}

export function Provider({
  children,
  queryClient,
}: {
  children: React.ReactNode;
  queryClient: QueryClient;
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthSessionProvider>{children}</AuthSessionProvider>
    </QueryClientProvider>
  );
}
