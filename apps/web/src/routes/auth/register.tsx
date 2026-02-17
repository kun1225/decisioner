import { Link, createFileRoute } from '@tanstack/react-router';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { RegisterForm } from '@/features/auth/_components/register-form';

export function normalizeRegisterRedirectTarget(input?: string): string {
  if (!input || !input.startsWith('/') || input.startsWith('//')) {
    return '/';
  }

  return input;
}

export const Route = createFileRoute('/auth/register')({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect:
      typeof search.redirect === 'string'
        ? normalizeRegisterRedirectTarget(search.redirect)
        : '/',
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = Route.useNavigate();
  const { redirect } = Route.useSearch();

  return (
    <main className="mx-auto w-full max-w-md p-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Account</CardTitle>
          <CardDescription>
            Register to secure your training data.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <RegisterForm
            onSuccess={async () => {
              await navigate({ href: redirect });
            }}
          />
        </CardContent>
        <CardFooter className="text-sm text-muted-foreground">
          <span>
            Already have an account?{' '}
            <Link
              to="/auth/login"
              search={{ redirect }}
              className="text-primary underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </span>
        </CardFooter>
      </Card>
    </main>
  );
}
