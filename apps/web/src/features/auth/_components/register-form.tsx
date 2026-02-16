import { useState } from 'react';

import { registerSchema } from '@repo/shared/auth';

import { register } from '../_domain/auth-api';
import { mapAuthApiError } from '../_domain/auth-errors';
import { setAccessToken } from '../_domain/token-storage';

type RegisterFormProps = {
  onSuccess?: (accessToken: string) => Promise<void> | void;
};

type RegisterFormValue = {
  email: string;
  name: string;
  password: string;
  confirmedPassword: string;
};

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const [value, setValue] = useState<RegisterFormValue>({
    email: '',
    name: '',
    password: '',
    confirmedPassword: '',
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    const parsed = registerSchema.safeParse(value);
    if (!parsed.success) {
      setErrorMessage(parsed.error.issues[0]?.message ?? 'Validation failed');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await register(parsed.data);
      setAccessToken(result.accessToken);
      await onSuccess?.(result.accessToken);
    } catch (error) {
      setErrorMessage(mapAuthApiError(error).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <label htmlFor="auth-register-email">Email</label>
      <input
        id="auth-register-email"
        type="email"
        autoComplete="email"
        value={value.email}
        onChange={(event) =>
          setValue((previous) => ({ ...previous, email: event.target.value }))
        }
        className="border rounded-md px-3 py-2"
      />

      <label htmlFor="auth-register-name">Name</label>
      <input
        id="auth-register-name"
        value={value.name}
        onChange={(event) =>
          setValue((previous) => ({ ...previous, name: event.target.value }))
        }
        className="border rounded-md px-3 py-2"
      />

      <label htmlFor="auth-register-password">Password</label>
      <input
        id="auth-register-password"
        type="password"
        autoComplete="new-password"
        value={value.password}
        onChange={(event) =>
          setValue((previous) => ({
            ...previous,
            password: event.target.value,
          }))
        }
        className="border rounded-md px-3 py-2"
      />

      <label htmlFor="auth-register-confirm-password">Confirm Password</label>
      <input
        id="auth-register-confirm-password"
        type="password"
        autoComplete="new-password"
        value={value.confirmedPassword}
        onChange={(event) =>
          setValue((previous) => ({
            ...previous,
            confirmedPassword: event.target.value,
          }))
        }
        className="border rounded-md px-3 py-2"
      />

      {errorMessage ? (
        <p className="text-sm text-red-600" role="alert">
          {errorMessage}
        </p>
      ) : null}

      <button
        type="submit"
        className="rounded-md px-4 py-2 bg-primary text-primary-foreground"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Creating...' : 'Create Account'}
      </button>
    </form>
  );
}
