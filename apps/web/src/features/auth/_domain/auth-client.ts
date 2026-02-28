export interface RegisterRequest {
  email: string
  name: string
  password: string
  confirmedPassword: string
}

export interface LoginRequest {
  email: string
  password: string
}

interface RegisterResponse {
  accessToken: string
  user: unknown
}

interface LoginResponse {
  accessToken: string
}

async function postJson<TResponse, TRequest>(
  path: string,
  body: TRequest,
): Promise<TResponse> {
  const response = await fetch(path, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  return response.json() as Promise<TResponse>
}

export function register(input: RegisterRequest) {
  return postJson<RegisterResponse, RegisterRequest>('/api/auth/register', input)
}

export function login(input: LoginRequest) {
  return postJson<LoginResponse, LoginRequest>('/api/auth/login', input)
}
