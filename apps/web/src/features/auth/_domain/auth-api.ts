import type { LoginInput, RegisterInput } from '@repo/shared/auth';
import { loginSchema, registerSchema } from '@repo/shared/auth';

import type { AuthApiError } from './auth-errors';
import { mapAuthApiError } from './auth-errors';
import type { AuthUser } from './auth-types';
import { normalizeAuthUser } from './auth-types';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000';
const AUTH_BASE_URL = `${API_BASE_URL}/api/auth`;

type AuthRequestOptions = {
  method: 'GET' | 'POST';
  body?: unknown;
  accessToken?: string;
};

function getAuthUrl(pathname: string): string {
  return `${AUTH_BASE_URL}${pathname}`;
}

function buildHeaders(options: AuthRequestOptions): HeadersInit {
  const baseHeaders: Record<string, string> = {
    Accept: 'application/json',
  };

  if (options.method === 'POST') {
    baseHeaders['Content-Type'] = 'application/json';
  }

  if (options.accessToken) {
    baseHeaders.Authorization = `Bearer ${options.accessToken}`;
  }

  return baseHeaders;
}

async function readJsonBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function mapFailedResponse(status: number, body: unknown): AuthApiError {
  const message =
    typeof body === 'object' &&
    body !== null &&
    'error' in body &&
    typeof body.error === 'string'
      ? body.error
      : 'Request failed';

  const code = status === 401 ? 'UNAUTHENTICATED' : 'REQUEST_FAILED';
  return mapAuthApiError({ status, code, message });
}

async function authRequest(
  pathname: string,
  options: AuthRequestOptions,
): Promise<unknown> {
  const response = await fetch(getAuthUrl(pathname), {
    method: options.method,
    credentials: 'include',
    headers: buildHeaders(options),
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const body = await readJsonBody(response);
  if (!response.ok) {
    throw mapFailedResponse(response.status, body);
  }

  return body;
}

export async function register(input: RegisterInput): Promise<{
  accessToken: string;
  user: AuthUser;
}> {
  const payload = registerSchema.parse(input);
  const response = (await authRequest('/register', {
    method: 'POST',
    body: payload,
  })) as { accessToken: string; user: unknown };

  return {
    accessToken: response.accessToken,
    user: normalizeAuthUser(response.user),
  };
}

export async function login(
  input: LoginInput,
): Promise<{ accessToken: string }> {
  const payload = loginSchema.parse(input);
  const response = (await authRequest('/login', {
    method: 'POST',
    body: payload,
  })) as { accessToken: string };

  return {
    accessToken: response.accessToken,
  };
}

export async function refresh(): Promise<{ accessToken: string }> {
  const response = (await authRequest('/refresh', {
    method: 'POST',
  })) as { accessToken: string };

  return {
    accessToken: response.accessToken,
  };
}

export async function logout(): Promise<void> {
  await authRequest('/logout', {
    method: 'POST',
  });
}

export async function me(accessToken: string): Promise<AuthUser> {
  const response = await authRequest('/me', {
    method: 'GET',
    accessToken,
  });

  return normalizeAuthUser(response);
}
