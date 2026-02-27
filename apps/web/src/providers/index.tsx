import type { ReactNode } from 'react'

import { AuthSessionProvider } from '@/features/auth/auth-session'

export function Provider({ children }: { children: ReactNode }) {
  return <AuthSessionProvider>{children}</AuthSessionProvider>
}
