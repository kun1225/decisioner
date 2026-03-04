import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { AuthSessionProvider } from '@/features/auth/_domain/auth-session-provider';
import { createAuthReadyGate } from '@/features/auth/_domain/auth-ready-gate';
import type { AuthSessionState } from '@/features/auth/_domain/auth-types';

export function getContext() {
  const queryClient = new QueryClient();

  const authRef: { current: AuthSessionState } = {
    current: { status: 'unknown' },
  };
  const gate = createAuthReadyGate();

  const onAuthStateChange = (state: AuthSessionState) => {
    authRef.current = state;
    gate.onStateChange(state.status);
  };

  return {
    queryClient,
    getAuthSessionState: () => authRef.current,
    waitForAuthReady: gate.wait,
    onAuthStateChange,
  };
}

export function Provider({
  children,
  context,
}: {
  children: React.ReactNode;
  context: ReturnType<typeof getContext>;
}) {
  return (
    <QueryClientProvider client={context.queryClient}>
      <AuthSessionProvider onStateChange={context.onAuthStateChange}>
        {children}
      </AuthSessionProvider>
    </QueryClientProvider>
  );
}
