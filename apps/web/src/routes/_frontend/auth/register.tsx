import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';

import { useAuthSessionActions } from '@/features/auth/_domain/auth-session-provider';

import { AuthShell } from './-components/auth-shell';
import { RegisterForm } from './-components/register-form';
import { buildAuthRedirectSearch } from './-domain/redirect-target';

type AuthSearch = {
  redirect?: string;
};

export const Route = createFileRoute('/_frontend/auth/register')({
  validateSearch: (search: Record<string, unknown>): AuthSearch => ({
    redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
  }),
  component: RegisterRoutePage,
});

function RegisterRoutePage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const { setAuthenticated } = useAuthSessionActions();

  return (
    <AuthShell
      title="Create account"
      description="Start tracking workouts and keep your gym progress in one place."
      footer={
        <p className="text-muted-foreground text-center text-sm">
          Already have an account?{' '}
          <Link
            to="/auth/login"
            search={buildAuthRedirectSearch(redirect)}
            className="text-primary font-medium underline underline-offset-4"
          >
            Sign in
          </Link>
        </p>
      }
    >
      <RegisterForm
        redirect={redirect}
        onAuthenticated={setAuthenticated}
        onSuccessRedirect={(target) => {
          navigate({ to: target as never }).catch(() => {
            return navigate({ to: '/dashboard' });
          });
        }}
      />
    </AuthShell>
  );
}
