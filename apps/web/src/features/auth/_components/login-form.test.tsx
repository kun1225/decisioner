import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { renderWithProviders } from '@/lib/render-with-providers';

import { LoginForm } from './login-form';

function createDeferred<T>() {
  let resolve: ((value: T) => void) | null = null;
  const promise = new Promise<T>((resolver) => {
    resolve = resolver;
  });

  return {
    promise,
    resolve(value: T) {
      if (!resolve) {
        throw new Error('Deferred resolver is not initialized');
      }
      resolve(value);
    },
  };
}

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
    const deferred = createDeferred<{ accessToken: string }>();
    loginMock.mockImplementation(() => deferred.promise);

    renderWithProviders(<LoginForm />);

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'joy@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'Strong@123' },
    });
    fireEvent.submit(screen.getByRole('button', { name: 'Sign In' }));

    expect(screen.getByRole('button', { name: 'Signing In...' })).toBeDefined();

    deferred.resolve({ accessToken: 'token-1' });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Sign In' })).toBeDefined();
    });
  });
});
