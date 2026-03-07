import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AppHeader } from './app-header';

const mockUseAuthSessionState = vi.fn();

vi.mock('@/features/auth/_domain/auth-session-provider', () => ({
  useAuthSessionState: () => mockUseAuthSessionState(),
  useAuthSessionActions: () => ({
    setAnonymous: vi.fn(),
    setAuthenticated: vi.fn(),
    setUnknown: vi.fn(),
  }),
}));

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock('@/features/auth/_domain/auth-client', () => ({
  logout: vi.fn().mockResolvedValue(undefined),
}));

describe('app-header', () => {
  it('shows logo and login link for anonymous users', () => {
    mockUseAuthSessionState.mockReturnValue({ status: 'anonymous' });

    render(<AppHeader logoHref="/" primaryHref="/auth/login" />);

    const logoLink = screen.getByText('Joy Gym').closest('a');
    const loginLink = screen.getByText('Login').closest('a');

    expect(logoLink?.getAttribute('href')).toBe('/');
    expect(loginLink?.getAttribute('href')).toBe('/auth/login');
  });

  it('renders nothing for action when auth status is unknown', () => {
    mockUseAuthSessionState.mockReturnValue({ status: 'unknown' });

    render(<AppHeader logoHref="/" primaryHref="/auth/login" />);

    expect(screen.queryByText('Login')).toBeNull();
  });

  it('shows user name for authenticated users', () => {
    mockUseAuthSessionState.mockReturnValue({
      status: 'authenticated',
      accessToken: 'tok',
      user: { id: 'u1', email: 'a@b.com', name: 'Alice' },
    });

    render(<AppHeader logoHref="/" primaryHref="/dashboard" />);

    expect(screen.getByText('Alice')).toBeTruthy();
  });
});
