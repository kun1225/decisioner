import { useState } from 'react';

import type { AuthUser } from '@/features/auth/_domain/auth-types';
import { register } from '@/features/auth/_domain/auth-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { mapAuthApiErrorToFormErrors } from '../_domain/form-error-mapper';
import { resolvePostAuthRedirect } from '../_domain/redirect-target';
import { validateRegisterInput } from '../_domain/auth-form-validation';

type RegisterFields = {
  email: string;
  name: string;
  password: string;
  confirmedPassword: string;
};

type RegisterFieldName = keyof RegisterFields;

type RegisterFormProps = {
  redirect?: string;
  onAuthenticated: (payload: { accessToken: string; user: AuthUser }) => void;
  onSuccessRedirect: (target: string) => void;
};

const REGISTER_FIELDS = ['email', 'name', 'password', 'confirmedPassword'] as const;

const DEFAULT_FORM_VALUES: RegisterFields = {
  email: '',
  name: '',
  password: '',
  confirmedPassword: '',
};

export function RegisterForm({
  redirect,
  onAuthenticated,
  onSuccessRedirect,
}: RegisterFormProps) {
  const [values, setValues] = useState<RegisterFields>(DEFAULT_FORM_VALUES);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<RegisterFieldName, string>>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setFieldValue = (field: RegisterFieldName, value: string) => {
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

    const nextFieldErrors = validateRegisterInput(values);
    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const response = await register(values);
      onAuthenticated({
        accessToken: response.accessToken,
        user: response.user,
      });
      onSuccessRedirect(resolvePostAuthRedirect(redirect));
    } catch (error) {
      const mappedErrors = mapAuthApiErrorToFormErrors(error, REGISTER_FIELDS);
      setFieldErrors(mappedErrors.fieldErrors);
      setFormError(mappedErrors.formError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
      {formError ? (
        <p
          role="alert"
          className="border-destructive/40 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm"
        >
          {formError}
        </p>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="register-email">Email</Label>
        <Input
          id="register-email"
          name="email"
          type="email"
          autoComplete="email"
          value={values.email}
          onChange={(event) => setFieldValue('email', event.target.value)}
          aria-invalid={Boolean(fieldErrors.email)}
          required
        />
        {fieldErrors.email ? (
          <p role="alert" className="text-destructive text-sm">
            {fieldErrors.email}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-name">Name</Label>
        <Input
          id="register-name"
          name="name"
          autoComplete="name"
          value={values.name}
          onChange={(event) => setFieldValue('name', event.target.value)}
          aria-invalid={Boolean(fieldErrors.name)}
          required
        />
        {fieldErrors.name ? (
          <p role="alert" className="text-destructive text-sm">
            {fieldErrors.name}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-password">Password</Label>
        <Input
          id="register-password"
          name="password"
          type="password"
          autoComplete="new-password"
          value={values.password}
          onChange={(event) => setFieldValue('password', event.target.value)}
          aria-invalid={Boolean(fieldErrors.password)}
          required
        />
        {fieldErrors.password ? (
          <p role="alert" className="text-destructive text-sm">
            {fieldErrors.password}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-confirmed-password">Confirm password</Label>
        <Input
          id="register-confirmed-password"
          name="confirmedPassword"
          type="password"
          autoComplete="new-password"
          value={values.confirmedPassword}
          onChange={(event) =>
            setFieldValue('confirmedPassword', event.target.value)
          }
          aria-invalid={Boolean(fieldErrors.confirmedPassword)}
          required
        />
        {fieldErrors.confirmedPassword ? (
          <p role="alert" className="text-destructive text-sm">
            {fieldErrors.confirmedPassword}
          </p>
        ) : null}
      </div>

      <Button
        type="submit"
        className="h-10 w-full cursor-pointer"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Creating account...' : 'Create account'}
      </Button>
    </form>
  );
}
