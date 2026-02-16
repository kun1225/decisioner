import { useAuthSession } from '../_domain/auth-session-store'

export function buildReLoginHref(currentPath: string): string {
  const redirect = currentPath || '/'
  return `/auth/login?redirect=${encodeURIComponent(redirect)}`
}

export function AuthGate({ children }: { children: React.ReactNode }) {
  const {
    state: { status },
  } = useAuthSession()

  if (status === 'idle' || status === 'restoring') {
    return <p className="p-6 text-sm text-muted-foreground">Restoring session...</p>
  }

  if (status === 'guest') {
    const reloginHref = buildReLoginHref(
      `${window.location.pathname}${window.location.search}`,
    )

    return (
      <section className="p-6 mx-auto max-w-lg grid gap-3">
        <h2 className="text-xl font-semibold">Session expired</h2>
        <p className="text-sm text-muted-foreground">
          Please sign in again to continue.
        </p>
        <a
          href={reloginHref}
          className="inline-flex rounded-md px-4 py-2 bg-primary text-primary-foreground"
        >
          Sign In Again
        </a>
      </section>
    )
  }

  return <>{children}</>
}
