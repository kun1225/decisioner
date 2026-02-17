import { createFileRoute } from '@tanstack/react-router';
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
      <h1 className="text-2xl font-semibold mb-4">Create Account</h1>
      <p className="text-sm text-muted-foreground mb-5">
        Register to secure your training data.
      </p>
      <RegisterForm
        onSuccess={async () => {
          await navigate({ href: redirect });
        }}
      />
    </main>
  );
}
