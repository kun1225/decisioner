import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  AuthApiError,
  register,
} from '@/features/auth/_domain/auth-client';

import { RegisterForm } from './register-form';

vi.mock('@/features/auth/_domain/auth-client', async () => {
  const actual = await vi.importActual('@/features/auth/_domain/auth-client');

  return {
    ...actual,
    register: vi.fn(),
  };
});

describe('register-form', () => {
  it('shows client validation errors and skips api request', async () => {
    render(
      <RegisterForm
        onAuthenticated={vi.fn()}
        onSuccessRedirect={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'joy@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'Joy' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'Passw0rd!' },
    });
    fireEvent.change(screen.getByLabelText('Confirm password'), {
      target: { value: 'different' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByText('Passwords do not match')).toBeTruthy();
    expect(register).not.toHaveBeenCalled();
  });

  it('maps api details to field-level errors', async () => {
    vi.mocked(register).mockRejectedValueOnce(
      new AuthApiError(400, 'Validation failed', [
        { path: 'name', message: 'Name is required' },
      ]),
    );

    render(
      <RegisterForm
        onAuthenticated={vi.fn()}
        onSuccessRedirect={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'valid@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'Joy' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'Passw0rd!' },
    });
    fireEvent.change(screen.getByLabelText('Confirm password'), {
      target: { value: 'Passw0rd!' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByText('Name is required')).toBeTruthy();
  });

  it('authenticates and redirects after successful registration', async () => {
    const onAuthenticated = vi.fn();
    const onSuccessRedirect = vi.fn();

    vi.mocked(register).mockResolvedValueOnce({
      accessToken: 'token-2',
      user: {
        id: 'u2',
        email: 'new@example.com',
        name: 'New User',
        avatarUrl: null,
      },
    });

    render(
      <RegisterForm
        redirect="/settings"
        onAuthenticated={onAuthenticated}
        onSuccessRedirect={onSuccessRedirect}
      />,
    );

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'new@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'New User' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'Passw0rd!' },
    });
    fireEvent.change(screen.getByLabelText('Confirm password'), {
      target: { value: 'Passw0rd!' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

    await waitFor(() => {
      expect(onAuthenticated).toHaveBeenCalledWith({
        accessToken: 'token-2',
        user: {
          id: 'u2',
          email: 'new@example.com',
          name: 'New User',
          avatarUrl: null,
        },
      });
    });

    expect(onSuccessRedirect).toHaveBeenCalledWith('/settings');
  });

  it('shows loading state during submission', () => {
    let resolveRegister:
      | ((value: { accessToken: string; user: { id: string; email: string; name: string } }) => void)
      | undefined;

    vi.mocked(register).mockReturnValueOnce(
      new Promise((resolve) => {
        resolveRegister = resolve;
      }),
    );

    render(
      <RegisterForm
        onAuthenticated={vi.fn()}
        onSuccessRedirect={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'new@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'New User' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'Passw0rd!' },
    });
    fireEvent.change(screen.getByLabelText('Confirm password'), {
      target: { value: 'Passw0rd!' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

    const submitButton = screen.getByRole('button', {
      name: 'Creating account...',
    });
    expect((submitButton as HTMLButtonElement).disabled).toBe(true);

    resolveRegister?.({
      accessToken: 'token-2',
      user: { id: 'u2', email: 'new@example.com', name: 'New User' },
    });
  });
});
