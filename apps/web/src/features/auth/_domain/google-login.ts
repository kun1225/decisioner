import { googleLoginSchema } from '@repo/shared/auth';

import { mapAuthApiError } from './auth-errors';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000';
const GOOGLE_LOGIN_URL = `${API_BASE_URL}/api/auth/google`;

const ENABLED_VALUES = new Set(['1', 'true', 'yes', 'on']);

export function isGoogleLoginEnabled(
  value = import.meta.env.VITE_ENABLE_GOOGLE_LOGIN,
): boolean {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value !== 'string') {
    return false;
  }

  return ENABLED_VALUES.has(value.trim().toLowerCase());
}

export async function googleLogin(
  idToken: string,
): Promise<{ accessToken: string }> {
  const payload = googleLoginSchema.parse({ idToken });

  const response = await fetch(GOOGLE_LOGIN_URL, {
    method: 'POST',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const responseBody = (await response.json().catch(() => ({}))) as
    | { accessToken?: string; error?: string }
    | undefined;

  if (!response.ok || !responseBody?.accessToken) {
    throw mapAuthApiError({
      status: response.status,
      code: response.status === 401 ? 'UNAUTHENTICATED' : 'REQUEST_FAILED',
      message: responseBody?.error ?? 'Google login failed',
    });
  }

  return {
    accessToken: responseBody.accessToken,
  };
}
