import { z } from 'zod'

export const registerSchema = z
  .object({
    email: z.email({ error: 'Invalid email address' }),
    password: z
      .string()
      .min(8, { error: 'Password must be at least 8 characters' })
      .max(72, { error: 'Password must be at most 72 characters' })
      .regex(/[a-z]/, { error: 'Password must contain a lowercase letter' })
      .regex(/[A-Z]/, { error: 'Password must contain an uppercase letter' })
      .regex(/[^a-zA-Z0-9]/, {
        error: 'Password must contain a special character',
      }),
    confirmedPassword: z.string(),
    name: z
      .string()
      .min(1, { error: 'Name is required' })
      .max(255, { error: 'Name must be at most 255 characters' }),
  })
  .check(
    z.refine((data) => data.password === data.confirmedPassword, {
      error: 'Passwords do not match',
      path: ['confirmedPassword'],
    }),
  )

export const loginSchema = z.object({
  email: z.email({ error: 'Invalid email address' }),
  password: z.string().min(1, { error: 'Password is required' }),
})

export const googleLoginSchema = z.object({
  idToken: z.string().min(1, { error: 'idToken is required' }),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type GoogleLoginInput = z.infer<typeof googleLoginSchema>
