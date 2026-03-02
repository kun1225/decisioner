import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  AuthApiError,
  login,
  me,
} from '@/features/auth/_domain/auth-client';

import { LoginForm } from './login-form';

vi.mock('@/features/auth/_domain/auth-client', async () => {
  const actual = await vi.importActual('@/features/auth/_domain/auth-client');

  return {
    ...actual,
    login: vi.fn(),
    me: vi.fn(),
  };
});

describe('login-form', () => {
  it('shows client validation errors and skips api request', async () => {
    const onAuthenticated = vi.fn();
    const onSuccessRedirect = vi.fn();

    render(
      <LoginForm
        onAuthenticated={onAuthenticated}
        onSuccessRedirect={onSuccessRedirect}
      />,
    );

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'bad-email' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: '' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Invalid email address')).toBeTruthy();
    expect(await screen.findByText('Password is required')).toBeTruthy();
    expect(login).not.toHaveBeenCalled();
  });

  it('shows form-level error for authentication failure', async () => {
    vi.mocked(login).mockRejectedValueOnce(
      new AuthApiError(401, 'Invalid email or password'),
    );

    render(
      <LoginForm
        onAuthenticated={vi.fn()}
        onSuccessRedirect={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'joy@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'Passw0rd!' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Invalid email or password')).toBeTruthy();
  });

  it('authenticates user and redirects to sanitized target', async () => {
    const onAuthenticated = vi.fn();
    const onSuccessRedirect = vi.fn();

    vi.mocked(login).mockResolvedValueOnce({ accessToken: 'token-1' });
    vi.mocked(me).mockResolvedValueOnce({
      id: 'u1',
      email: 'joy@example.com',
      name: 'Joy',
      avatarUrl: null,
    });

    render(
      <LoginForm
        redirect="/workouts/history"
        onAuthenticated={onAuthenticated}
        onSuccessRedirect={onSuccessRedirect}
      />,
    );

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'joy@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'Passw0rd!' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(onAuthenticated).toHaveBeenCalledWith({
        accessToken: 'token-1',
        user: {
          id: 'u1',
          email: 'joy@example.com',
          name: 'Joy',
          avatarUrl: null,
        },
      });
    });

    expect(me).toHaveBeenCalledWith('token-1');
    expect(onSuccessRedirect).toHaveBeenCalledWith('/workouts/history');
  });

  it('disables submit button while request is in-flight', () => {
    let resolveLogin: ((value: { accessToken: string }) => void) | undefined;
    vi.mocked(login).mockReturnValueOnce(
      new Promise((resolve) => {
        resolveLogin = resolve;
      }),
    );
    vi.mocked(me).mockResolvedValueOnce({
      id: 'u1',
      email: 'joy@example.com',
      name: 'Joy',
      avatarUrl: null,
    });

    render(
      <LoginForm
        onAuthenticated={vi.fn()}
        onSuccessRedirect={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'joy@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'Passw0rd!' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    const submitButton = screen.getByRole('button', { name: 'Signing in...' });
    expect((submitButton as HTMLButtonElement).disabled).toBe(true);

    resolveLogin?.({ accessToken: 'token-1' });
  });
});
