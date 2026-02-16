import { useState } from 'react'

import { loginSchema } from '@repo/shared/auth'

import { login } from '../_domain/auth-api'
import { mapAuthApiError } from '../_domain/auth-errors'
import { setAccessToken } from '../_domain/token-storage'

type LoginFormProps = {
  onSuccess?: (accessToken: string) => Promise<void> | void
}

type LoginFormValue = {
  email: string
  password: string
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const [value, setValue] = useState<LoginFormValue>({
    email: '',
    password: '',
  })
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage(null)

    const parsed = loginSchema.safeParse(value)
    if (!parsed.success) {
      setErrorMessage(parsed.error.issues[0]?.message ?? 'Validation failed')
      return
    }

    setIsSubmitting(true)
    try {
      const result = await login(parsed.data)
      setAccessToken(result.accessToken)
      await onSuccess?.(result.accessToken)
    } catch (error) {
      setErrorMessage(mapAuthApiError(error).message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <label htmlFor="auth-login-email">Email</label>
        <input
          id="auth-login-email"
          name="email"
          type="email"
          autoComplete="email"
          value={value.email}
          onChange={(event) =>
            setValue((previous) => ({
              ...previous,
              email: event.target.value,
            }))
          }
          className="border rounded-md px-3 py-2"
        />
      </div>

      <div className="grid gap-2">
        <label htmlFor="auth-login-password">Password</label>
        <input
          id="auth-login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={value.password}
          onChange={(event) =>
            setValue((previous) => ({
              ...previous,
              password: event.target.value,
            }))
          }
          className="border rounded-md px-3 py-2"
        />
      </div>

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
        {isSubmitting ? 'Signing In...' : 'Sign In'}
      </button>
    </form>
  )
}
