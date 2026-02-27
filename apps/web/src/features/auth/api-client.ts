import type { LoginInput, RegisterInput } from '@repo/shared/auth'

type User = {
  id: string
  email: string
  name: string
}

type AccessTokenResponse = {
  accessToken: string
}

type RegisterResponse = AccessTokenResponse & {
  user: User
}

type ApiErrorBody = {
  message?: string
}

export class AuthApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = 'AuthApiError'
  }
}

async function parseJson<T>(response: Response): Promise<T> {
  const json = (await response.json().catch(() => null)) as T | ApiErrorBody | null

  if (!response.ok) {
    throw new AuthApiError(
      response.status,
      (json as ApiErrorBody | null)?.message ?? 'Request failed',
    )
  }

  return json as T
}

async function authFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(path, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  })
}

export async function login(input: LoginInput): Promise<AccessTokenResponse> {
  const response = await authFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
  })

  return parseJson<AccessTokenResponse>(response)
}

export async function register(
  input: RegisterInput,
): Promise<RegisterResponse> {
  const response = await authFetch('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  })

  return parseJson<RegisterResponse>(response)
}

export async function logout(): Promise<void> {
  await authFetch('/api/auth/logout', { method: 'POST' })
}

export async function me(accessToken: string): Promise<User> {
  const response = await authFetch('/api/auth/me', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  return parseJson<User>(response)
}
