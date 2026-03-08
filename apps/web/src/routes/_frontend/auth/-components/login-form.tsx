import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { login, me } from '@/features/auth/_domain/auth-client';
import type { AuthUser } from '@/features/auth/_domain/auth-types';

import { validateLoginInput } from '../-domain/auth-form-validation';
import { mapAuthApiErrorToFormErrors } from '../-domain/form-error-mapper';
import { resolvePostAuthRedirect } from '../-domain/redirect-target';

type LoginFields = {
  email: string;
  password: string;
};

type LoginFieldName = keyof LoginFields;

type LoginFormProps = {
  redirect?: string;
  onAuthenticated: (payload: { accessToken: string; user: AuthUser }) => void;
  onSuccessRedirect: (target: string) => void;
};

const LOGIN_FIELDS = ['email', 'password'] as const;

const DEFAULT_FORM_VALUES: LoginFields = {
  email: '',
  password: '',
};

export function LoginForm({
  redirect,
  onAuthenticated,
  onSuccessRedirect,
}: LoginFormProps) {
  const [values, setValues] = useState<LoginFields>(DEFAULT_FORM_VALUES);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<LoginFieldName, string>>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setFieldValue = (field: LoginFieldName, value: string) => {
    setValues((previous) => ({
      ...previous,
      [field]: value,
    }));

    if (fieldErrors[field]) {
      setFieldErrors((previous) => ({
        ...previous,
        [field]: undefined,
      }));
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setFormError(null);

    const nextFieldErrors = validateLoginInput(values);
    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const response = await login(values);
      const user = await me(response.accessToken);

      onAuthenticated({
        accessToken: response.accessToken,
        user,
      });
      onSuccessRedirect(resolvePostAuthRedirect(redirect));
    } catch (error) {
      const mappedErrors = mapAuthApiErrorToFormErrors(error, LOGIN_FIELDS);
      setFieldErrors(mappedErrors.fieldErrors);
      setFormError(mappedErrors.formError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
      {formError ? (
        <FieldError className="border-destructive/40 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm">
          {formError}
        </FieldError>
      ) : null}

      <FieldGroup className="gap-4">
        <Field data-invalid={Boolean(fieldErrors.email)}>
          <FieldLabel htmlFor="login-email">Email</FieldLabel>
          <Input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            value={values.email}
            onChange={(event) => setFieldValue('email', event.target.value)}
            aria-invalid={Boolean(fieldErrors.email)}
            required
          />
          {fieldErrors.email ? (
            <FieldError>{fieldErrors.email}</FieldError>
          ) : null}
        </Field>

        <Field data-invalid={Boolean(fieldErrors.password)}>
          <FieldLabel htmlFor="login-password">Password</FieldLabel>
          <Input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={values.password}
            onChange={(event) => setFieldValue('password', event.target.value)}
            aria-invalid={Boolean(fieldErrors.password)}
            required
          />
          {fieldErrors.password ? (
            <FieldError>{fieldErrors.password}</FieldError>
          ) : null}
        </Field>
      </FieldGroup>

      <Button
        type="submit"
        className="h-10 w-full cursor-pointer"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Signing in...' : 'Sign in'}
      </Button>
    </form>
  );
}
