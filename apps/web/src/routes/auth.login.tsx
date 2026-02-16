import { createFileRoute } from '@tanstack/react-router'

import { GoogleLoginButton } from '@/features/auth/_components/google-login-button'
import { LoginForm } from '@/features/auth/_components/login-form'

export function normalizeRedirectTarget(input?: string): string {
  if (!input || !input.startsWith('/') || input.startsWith('//')) {
    return '/'
  }

  return input
}

export const Route = createFileRoute('/auth/login')({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect:
      typeof search.redirect === 'string'
        ? normalizeRedirectTarget(search.redirect)
        : '/',
  }),
  component: LoginPage,
})

function LoginPage() {
  const navigate = Route.useNavigate()
  const { redirect } = Route.useSearch()

  return (
    <main className="mx-auto w-full max-w-md p-6">
      <h1 className="text-2xl font-semibold mb-4">Sign In</h1>
      <p className="text-sm text-muted-foreground mb-5">
        Use your account to continue.
      </p>
      <LoginForm
        onSuccess={async () => {
          await navigate({ to: redirect })
        }}
      />
      <GoogleLoginButton />
    </main>
  )
}
