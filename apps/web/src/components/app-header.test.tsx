import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AppHeader } from './app-header';

const mockUseAuthSessionState = vi.fn();
const mockUseRouterState = vi.fn();
const mockHandleLogout = vi.fn();

vi.mock('@tanstack/react-router', () => ({
  useRouterState: (options: {
    select: (state: {
      location: { pathname: string; searchStr: string; hash: string };
    }) => {
      pathname: string;
      searchStr: string;
      hash: string;
    };
  }) => mockUseRouterState(options),
}));

vi.mock('@/features/auth/_domain/auth-session-provider', () => ({
  useAuthSessionState: () => mockUseAuthSessionState(),
}));

vi.mock('@/features/auth/_domain/use-logout', () => ({
  useLogout: () => ({
    handleLogout: mockHandleLogout,
    isLoggingOut: false,
  }),
}));

describe('app-header', () => {
  it('shows logo and login link for anonymous users', () => {
    mockUseRouterState.mockImplementation((options) =>
      options.select({
        location: {
          pathname: '/auth/register',
          searchStr: '',
          hash: '',
        },
      }),
    );
    mockUseAuthSessionState.mockReturnValue({ status: 'anonymous' });

    render(<AppHeader />);

    const logoLink = screen.getByText('Joy Gym').closest('a');
    const loginLink = screen.getByText('Login').closest('a');

    expect(logoLink?.getAttribute('href')).toBe('/');
    expect(loginLink?.getAttribute('href')).toBe('/auth/login');
  });

  it('includes redirect for anonymous users on frontend routes', () => {
    mockUseRouterState.mockImplementation((options) =>
      options.select({
        location: {
          pathname: '/workouts',
          searchStr: '?tab=history',
          hash: '#today',
        },
      }),
    );
    mockUseAuthSessionState.mockReturnValue({ status: 'anonymous' });

    render(<AppHeader />);

    const loginLink = screen.getByText('Login').closest('a');

    expect(loginLink?.getAttribute('href')).toBe(
      '/auth/login?redirect=%2Fworkouts%3Ftab%3Dhistory%23today',
    );
  });

  it('renders nothing for action when auth status is unknown', () => {
    mockUseRouterState.mockImplementation((options) =>
      options.select({
        location: {
          pathname: '/',
          searchStr: '',
          hash: '',
        },
      }),
    );
    mockUseAuthSessionState.mockReturnValue({ status: 'unknown' });

    render(<AppHeader />);

    expect(screen.queryByText('Login')).toBeNull();
  });

  it('shows user name for authenticated users', () => {
    mockUseRouterState.mockImplementation((options) =>
      options.select({
        location: {
          pathname: '/',
          searchStr: '',
          hash: '',
        },
      }),
    );
    mockUseAuthSessionState.mockReturnValue({
      status: 'authenticated',
      accessToken: 'tok',
      user: { id: 'u1', email: 'a@b.com', name: 'Alice' },
    });

    render(<AppHeader />);

    expect(screen.getByText('Alice')).toBeTruthy();
  });
});
