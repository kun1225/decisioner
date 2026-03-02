import type { AuthUser, LoginRequest, RegisterRequest } from './auth-types';

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(
    /\/+$/,
    '',
  ) ?? '/api';

type RegisterResponse = {
  accessToken: string;
  user: AuthUser;
};

type LoginResponse = {
  accessToken: string;
};

type RefreshResponse = {
  accessToken: string;
};

type ApiErrorDetail = {
  path: string;
  message: string;
};

type ApiErrorPayload = {
  error?: string;
  details?: Array<ApiErrorDetail>;
};

export class AuthApiError extends Error {
  readonly status: number;
  readonly details?: Array<ApiErrorDetail>;

  constructor(
    status: number,
    message: string,
    details?: Array<ApiErrorDetail>,
  ) {
    super(message);
    this.name = 'AuthApiError';
    this.status = status;
    this.details = details;
  }
}

async function parseApiError(response: Response) {
  let payload: ApiErrorPayload = {};

  try {
    payload = (await response.json()) as ApiErrorPayload;
  } catch {
    payload = {};
  }

  const message = payload.error ?? 'Request failed';
  throw new AuthApiError(response.status, message, payload.details);
}

async function postJson<TResponse, TRequest>(
  path: string,
  body: TRequest,
): Promise<TResponse> {
  const response = await fetch(apiUrl(path), {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    await parseApiError(response);
  }

  return response.json() as Promise<TResponse>;
}

function apiUrl(path: string) {
  return `${API_BASE_URL}${path}`;
}

export function register(input: RegisterRequest) {
  return postJson<RegisterResponse, RegisterRequest>('/auth/register', input);
}

export function login(input: LoginRequest) {
  return postJson<LoginResponse, LoginRequest>('/auth/login', input);
}

export async function refresh() {
  return fetch(apiUrl('/auth/refresh'), {
    method: 'POST',
    credentials: 'include',
  }).then(async (response) => {
    if (!response.ok) {
      await parseApiError(response);
    }
    return response.json() as Promise<RefreshResponse>;
  });
}

export async function logout() {
  const response = await fetch(apiUrl('/auth/logout'), {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) {
    await parseApiError(response);
  }
}

export async function me(accessToken: string) {
  return fetch(apiUrl('/auth/me'), {
    method: 'GET',
    credentials: 'include',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  }).then(async (response) => {
    if (!response.ok) {
      await parseApiError(response);
    }
    return response.json() as Promise<AuthUser>;
  });
}
