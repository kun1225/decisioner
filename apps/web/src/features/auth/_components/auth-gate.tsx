import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';

import { useAuthSession } from '../_domain/auth-session-store';

export function buildReLoginHref(currentPath: string): string {
  const redirect = currentPath || '/';
  return `/auth/login?redirect=${encodeURIComponent(redirect)}`;
}

export function AuthGate({ children }: { children: React.ReactNode }) {
  const {
    state: { status },
  } = useAuthSession();

  if (status === 'idle' || status === 'restoring') {
    return (
      <Card className="mx-auto mt-6 max-w-lg">
        <CardContent>
          <p className="text-sm text-muted-foreground">Restoring session...</p>
        </CardContent>
      </Card>
    );
  }

  if (status === 'guest') {
    const reloginHref = buildReLoginHref(
      `${window.location.pathname}${window.location.search}`,
    );

    return (
      <Card className="mx-auto mt-6 max-w-lg">
        <CardHeader>
          <CardTitle>Session expired</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <p className="text-sm text-muted-foreground">
            Please sign in again to continue.
          </p>
          <a
            href={reloginHref}
            className={buttonVariants({ className: 'w-fit' })}
          >
            Sign In Again
          </a>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
}
