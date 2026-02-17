import { createFileRoute, Link, useRouter } from '@tanstack/react-router';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { GoogleLoginButton } from '@/features/auth/_components/google-login-button';
import { LoginForm } from '@/features/auth/_components/login-form';
import { normalizeRedirectPath } from '@/lib/auth-utils';

export const Route = createFileRoute('/auth/login')({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect:
      typeof search.redirect === 'string'
        ? normalizeRedirectPath(search.redirect)
        : '/',
  }),
  component: LoginPage,
});

function LoginPage() {
  const router = useRouter();
  const { redirect } = Route.useSearch();

  return (
    <main className="mx-auto w-full max-w-md p-6">
      <Card>
        <CardHeader>
          <CardTitle>Sign In</CardTitle>
          <CardDescription>Use your account to continue.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <LoginForm
            onSuccess={() => {
              router.history.push(redirect);
            }}
          />
          <GoogleLoginButton />
        </CardContent>
        <CardFooter className="text-sm text-muted-foreground">
          <span>
            New here?{' '}
            <Link
              to="/auth/register"
              search={{ redirect }}
              className="text-primary underline-offset-4 hover:underline"
            >
              Create account
            </Link>
          </span>
        </CardFooter>
      </Card>
    </main>
  );
}
