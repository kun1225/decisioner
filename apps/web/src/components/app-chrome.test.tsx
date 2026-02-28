import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AppChrome } from './app-chrome';

const mockUseRouterState = vi.fn();
const mockUseAuthSessionState = vi.fn();
const mockNavigate = vi.fn();

vi.mock('@tanstack/react-router', () => ({
  useRouterState: (options: {
    select: (state: { location: { pathname: string } }) => string;
  }) => mockUseRouterState(options),
  useNavigate: () => mockNavigate,
}));

vi.mock('@/features/auth/_domain/auth-session-provider', () => ({
  useAuthSessionState: () => mockUseAuthSessionState(),
}));

describe('app-chrome', () => {
  it('renders login href with redirect when anonymous user is on a frontend page', () => {
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

    render(
      <AppChrome>
        <div>Page Content</div>
      </AppChrome>,
    );

    const loginLink = screen.getByText('Login').closest('a');
    expect(loginLink?.getAttribute('href')).toBe(
      '/auth/login?redirect=%2Fworkouts%3Ftab%3Dhistory%23today',
    );
  });

  it('renders sticky frontend header outside dashboard routes', () => {
    mockUseRouterState.mockImplementation((options) =>
      options.select({
        location: { pathname: '/auth/login', searchStr: '', hash: '' },
      }),
    );
    mockUseAuthSessionState.mockReturnValue({ status: 'anonymous' });

    render(
      <AppChrome>
        <div>Page Content</div>
      </AppChrome>,
    );

    expect(screen.getByText('Login')).toBeTruthy();
    const loginLink = screen.getByText('Login').closest('a');
    expect(loginLink?.getAttribute('href')).toBe('/auth/login');
    expect(screen.getByText('Page Content')).toBeTruthy();
    expect(screen.queryByText('後台導覽')).toBeNull();
  });

  it('does not nest redirect when already on auth route', () => {
    mockUseRouterState.mockImplementation((options) =>
      options.select({
        location: {
          pathname: '/auth/login',
          searchStr: '?redirect=%2Fdashboard',
          hash: '',
        },
      }),
    );
    mockUseAuthSessionState.mockReturnValue({ status: 'anonymous' });

    render(
      <AppChrome>
        <div>Page Content</div>
      </AppChrome>,
    );

    const loginLink = screen.getByText('Login').closest('a');
    expect(loginLink?.getAttribute('href')).toBe(
      '/auth/login?redirect=%2Fdashboard',
    );
  });

  it('renders sidebar layout on dashboard routes', () => {
    mockUseRouterState.mockImplementation((options) =>
      options.select({
        location: { pathname: '/dashboard', searchStr: '', hash: '' },
      }),
    );
    mockUseAuthSessionState.mockReturnValue({ status: 'authenticated' });

    render(
      <AppChrome>
        <div>Dashboard Content</div>
      </AppChrome>,
    );

    expect(screen.getByText('後台導覽')).toBeTruthy();
    expect(screen.getByText('Dashboard Content')).toBeTruthy();
    expect(screen.queryByText('Login')).toBeNull();
    expect(screen.queryByRole('main')).toBeNull();
  });
});
