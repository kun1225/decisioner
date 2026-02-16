import { useEffect } from 'react'

import { useAuthSession } from '../_domain/auth-session-store'
import { useSessionRestore } from '../_domain/use-session-restore'

export function SessionRestoreBootstrap({
  children,
}: {
  children: React.ReactNode
}) {
  const {
    state: { status },
  } = useAuthSession()
  const restoreSession = useSessionRestore()

  useEffect(() => {
    if (status !== 'idle') {
      return
    }

    void restoreSession()
  }, [restoreSession, status])

  return <>{children}</>
}
