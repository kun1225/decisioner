import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { renderWithProviders } from '@/lib/render-with-providers';

import { LoginForm } from './login-form';

const loginMock = vi.fn();
const setAccessTokenMock = vi.fn();

vi.mock('../_domain/auth-api', () => ({
  login: (...args: Array<unknown>) => loginMock(...args),
}));

vi.mock('../_domain/token-storage', () => ({
  setAccessToken: (...args: Array<unknown>) => setAccessTokenMock(...args),
}));

describe('login-form', () => {
  beforeEach(() => {
    loginMock.mockReset();
    setAccessTokenMock.mockReset();
  });

  it('shows validation message for invalid input', async () => {
    renderWithProviders(<LoginForm />);

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'bad' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: '' },
    });
    fireEvent.submit(screen.getByRole('button', { name: 'Sign In' }));

    expect(await screen.findByText('Invalid email address')).toBeDefined();
    expect(loginMock).not.toHaveBeenCalled();
  });

  it('logs in and forwards success callback', async () => {
    loginMock.mockResolvedValue({ accessToken: 'token-1' });
    const onSuccess = vi.fn();

    renderWithProviders(<LoginForm onSuccess={onSuccess} />);

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'joy@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'Strong@123' },
    });
    fireEvent.submit(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledTimes(1);
    });
    expect(setAccessTokenMock).toHaveBeenCalledWith('token-1');
    expect(onSuccess).toHaveBeenCalledWith('token-1');
  });

  it('renders api error message', async () => {
    loginMock.mockRejectedValue(new Error('Invalid email or password'));

    renderWithProviders(<LoginForm />);

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'joy@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'wrong' },
    });
    fireEvent.submit(screen.getByRole('button', { name: 'Sign In' }));

    expect(await screen.findByText('Invalid email or password')).toBeDefined();
  });

  it('shows submitting text while login is pending', async () => {
    let resolveLogin: ((value: { accessToken: string }) => void) | null = null;
    loginMock.mockImplementation(
      () =>
        new Promise<{ accessToken: string }>((resolve) => {
          resolveLogin = resolve;
        }),
    );

    renderWithProviders(<LoginForm />);

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'joy@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'Strong@123' },
    });
    fireEvent.submit(screen.getByRole('button', { name: 'Sign In' }));

    expect(screen.getByRole('button', { name: 'Signing In...' })).toBeDefined();

    if (resolveLogin) {
      resolveLogin({ accessToken: 'token-1' });
    }

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Sign In' })).toBeDefined();
    });
  });
});
