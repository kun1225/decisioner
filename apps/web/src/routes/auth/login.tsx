import { Link, createFileRoute, useNavigate } from '@tanstack/react-router';

import { useAuthSessionActions } from '@/features/auth/_domain/auth-session-provider';

import { AuthShell } from './_components/auth-shell';
import { LoginForm } from './_components/login-form';
import { buildAuthRedirectSearch } from './_domain/redirect-target';

type AuthSearch = {
  redirect?: string;
};

export const Route = createFileRoute('/auth/login')({
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
