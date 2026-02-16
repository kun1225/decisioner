import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { renderWithProviders } from '@/lib/render-with-providers';

import { AuthGate } from './auth-gate';

const useAuthSessionMock = vi.fn();

vi.mock('../_domain/auth-session-store', () => ({
  useAuthSession: () => useAuthSessionMock(),
}));

describe('auth-gate', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/');
    useAuthSessionMock.mockReset();
  });

  it('shows restoring state UI', () => {
    useAuthSessionMock.mockReturnValue({
      state: { status: 'restoring', user: null, accessToken: null },
    });

    renderWithProviders(
      <AuthGate>
        <p>dashboard</p>
      </AuthGate>,
    );

    expect(screen.getByText('Restoring session...')).toBeDefined();
  });

  it('shows re-login prompt when user is guest', () => {
    window.history.pushState({}, '', '/progress');
    useAuthSessionMock.mockReturnValue({
      state: { status: 'guest', user: null, accessToken: null },
    });

    renderWithProviders(
      <AuthGate>
        <p>dashboard</p>
      </AuthGate>,
    );

    const reloginLink = screen.getByRole('link', { name: 'Sign In Again' });
    expect(reloginLink.getAttribute('href')).toBe(
      '/auth/login?redirect=%2Fprogress',
    );
  });

  it('renders children when authenticated', () => {
    useAuthSessionMock.mockReturnValue({
      state: {
        status: 'authenticated',
        user: { id: 'u-1', email: 'joy@example.com', name: 'Joy' },
        accessToken: 'token-1',
      },
    });

    renderWithProviders(
      <AuthGate>
        <p>dashboard</p>
      </AuthGate>,
    );

    expect(screen.getByText('dashboard')).toBeDefined();
  });
});
