import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { FrontendLayout } from './frontend-layout';

const mockUseRouterState = vi.fn();
const mockUseAuthSessionState = vi.fn();

vi.mock('@tanstack/react-router', () => ({
  useRouterState: (options: {
    select: (
      state: {
        location: { pathname: string; searchStr: string; hash: string };
      },
    ) => string;
  }) => mockUseRouterState(options),
}));

vi.mock('@/features/auth/_domain/auth-session-provider', () => ({
  useAuthSessionState: () => mockUseAuthSessionState(),
}));

describe('frontend-layout', () => {
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
      <FrontendLayout>
        <div>Page Content</div>
      </FrontendLayout>,
    );

    const loginLink = screen.getByText('Login').closest('a');
    expect(loginLink?.getAttribute('href')).toBe(
      '/auth/login?redirect=%2Fworkouts%3Ftab%3Dhistory%23today',
    );
    expect(screen.getByText('Page Content')).toBeTruthy();
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
      <FrontendLayout>
        <div>Page Content</div>
      </FrontendLayout>,
    );

    const loginLink = screen.getByText('Login').closest('a');
    expect(loginLink?.getAttribute('href')).toBe(
      '/auth/login?redirect=%2Fdashboard',
    );
  });

  it('renders dashboard link for authenticated users', () => {
    mockUseRouterState.mockImplementation((options) =>
      options.select({
        location: {
          pathname: '/',
          searchStr: '',
          hash: '',
        },
      }),
    );
    mockUseAuthSessionState.mockReturnValue({ status: 'authenticated' });

    render(
      <FrontendLayout>
        <div>Page Content</div>
      </FrontendLayout>,
    );

    const dashboardLink = screen.getByText('Dashboard').closest('a');
    expect(dashboardLink?.getAttribute('href')).toBe('/dashboard');
  });
});
