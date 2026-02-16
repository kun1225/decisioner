import { createFileRoute } from '@tanstack/react-router'

import { ComponentExample } from '@/components/component-example'
import { AuthGate } from '@/features/auth/_components/auth-gate'

export const Route = createFileRoute('/')({ component: App })

function App() {
  return (
    <AuthGate>
      <ComponentExample />
    </AuthGate>
  )
}
