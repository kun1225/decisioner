import { zodResolver } from '@hookform/resolvers/zod'
import {
  createFileRoute,
  useNavigate,
  useSearch,
} from '@tanstack/react-router'
import { loginSchema, type LoginInput } from '@repo/shared/auth'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { login, me } from '@/features/auth/api-client'
import { useAuthSession } from '@/features/auth/auth-session'
import { sanitizeRedirectTarget } from '@/features/auth/redirect'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'

export const Route = createFileRoute('/auth/login')({
  component: LoginPage,
})

export function LoginPage() {
  const navigate = useNavigate()
  const search = useSearch({ strict: false }) as { redirect?: string }
  const { setAuthenticated } = useAuthSession()
  const [submitError, setSubmitError] = useState<string | null>(null)

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  async function onSubmit(values: LoginInput) {
    setSubmitError(null)

    try {
      const tokenResult = await login(values)
      const user = await me(tokenResult.accessToken)

      setAuthenticated({
        accessToken: tokenResult.accessToken,
        user,
      })

      await navigate({ to: sanitizeRedirectTarget(search.redirect) })
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Login failed')
    }
  }

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="mb-6 text-2xl font-semibold">Login</h1>
      <Form {...form}>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input aria-label="Email" placeholder="you@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input aria-label="Password" type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {submitError ? <p className="text-destructive text-sm">{submitError}</p> : null}

          <Button disabled={form.formState.isSubmitting} type="submit">
            Login
          </Button>
        </form>
      </Form>
    </main>
  )
}
