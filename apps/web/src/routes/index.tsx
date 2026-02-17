import { createFileRoute } from '@tanstack/react-router';

import { AuthGate } from '@/features/auth/_components/auth-gate';

export const Route = createFileRoute('/')({ component: App });

function App() {
  return (
    <AuthGate>
      <p>Home Page</p>
    </AuthGate>
  );
}
