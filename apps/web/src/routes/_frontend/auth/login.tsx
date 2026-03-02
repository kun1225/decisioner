import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';

import { useAuthSessionActions } from '@/features/auth/_domain/auth-session-provider';

import { AuthShell } from './-components/auth-shell';
import { LoginForm } from './-components/login-form';
import { buildAuthRedirectSearch } from './-domain/redirect-target';

type AuthSearch = {
  redirect?: string;
};

export const Route = createFileRoute('/_frontend/auth/login')({
  validateSearch: (search: Record<string, unknown>): AuthSearch => ({
    redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
  }),
  component: LoginRoutePage,
});

function LoginRoutePage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const { setAuthenticated } = useAuthSessionActions();

  return (
    <AuthShell
      title="Sign in"
      description="Use your JoyGym account to continue your training plan."
      footer={
        <p className="text-muted-foreground text-center text-sm">
          New to JoyGym?{' '}
          <Link
            to="/auth/register"
            search={buildAuthRedirectSearch(redirect)}
            className="text-primary font-medium underline underline-offset-4"
          >
            Create an account
          </Link>
        </p>
      }
    >
      <LoginForm
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
