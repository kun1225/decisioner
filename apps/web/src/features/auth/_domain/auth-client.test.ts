import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  AuthApiError,
  login,
  logout,
  me,
  refresh,
  register,
} from './auth-client';

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(
    /\/+$/,
    '',
  ) ?? '/api';

function expectedApiUrl(path: string) {
  return `${API_BASE_URL}${path}`;
}

describe('auth-client request contract', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('calls register endpoint with include credentials and json body', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => ({ accessToken: 'token', user: { id: 'u1' } }),
    });

    await register({
      email: 'joy@example.com',
      name: 'Joy',
      password: 'Passw0rd!',
      confirmedPassword: 'Passw0rd!',
    });

    expect(fetchMock).toHaveBeenCalledWith(expectedApiUrl('/auth/register'), {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'joy@example.com',
        name: 'Joy',
        password: 'Passw0rd!',
        confirmedPassword: 'Passw0rd!',
      }),
    });
  });

  it('calls login endpoint with include credentials and json body', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => ({ accessToken: 'token' }),
    });

    await login({ email: 'joy@example.com', password: 'Passw0rd!' });

    expect(fetchMock).toHaveBeenCalledWith(expectedApiUrl('/auth/login'), {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'joy@example.com', password: 'Passw0rd!' }),
    });
  });

  it('calls refresh and logout endpoints with include credentials', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () => ({ accessToken: 'rotated' }),
      })
      .mockResolvedValueOnce({ ok: true, json: () => ({}) });

    await refresh();
    await logout();

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      expectedApiUrl('/auth/refresh'),
      {
        method: 'POST',
        credentials: 'include',
      },
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      expectedApiUrl('/auth/logout'),
      {
        method: 'POST',
        credentials: 'include',
      },
    );
  });

  it('calls me endpoint with bearer token', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => ({ id: 'u1' }),
    });

    await me('access-token');

    expect(fetchMock).toHaveBeenCalledWith(expectedApiUrl('/auth/me'), {
      method: 'GET',
      credentials: 'include',
      headers: { Authorization: 'Bearer access-token' },
    });
  });

  it('throws AuthApiError when response is not ok', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: () => ({ error: 'Invalid email or password' }),
    });

    await expect(
      login({ email: 'joy@example.com', password: 'bad' }),
    ).rejects.toEqual(new AuthApiError(401, 'Invalid email or password'));
  });

  it('preserves validation error details on api error', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => ({
        error: 'Validation failed',
        details: [{ path: 'email', message: 'Invalid email address' }],
      }),
    });

    await expect(
      register({
        email: 'bad',
        name: 'Joy',
        password: 'Passw0rd!',
        confirmedPassword: 'Passw0rd!',
      }),
    ).rejects.toMatchObject({
      status: 400,
      message: 'Validation failed',
      details: [{ path: 'email', message: 'Invalid email address' }],
    });
  });
});
