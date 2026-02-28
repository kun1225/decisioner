import { fireEvent } from '@testing-library/dom';
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
  it('navigates to login with redirect when anonymous user clicks header action', () => {
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

    fireEvent.click(screen.getByRole('button', { name: '登入' }));

    expect(mockNavigate).toHaveBeenCalledWith({
      to: '/auth/login',
      search: {
        redirect: '/workouts?tab=history#today',
      },
    });
  });

  it('renders sticky frontend header outside dashboard routes', () => {
    mockUseRouterState.mockImplementation((options) =>
      options.select({ location: { pathname: '/auth/login' } }),
    );
    mockUseAuthSessionState.mockReturnValue({ status: 'anonymous' });

    render(
      <AppChrome>
        <div>Page Content</div>
      </AppChrome>,
    );

    expect(screen.getByRole('button', { name: '登入' })).toBeTruthy();
    expect(screen.getByText('Page Content')).toBeTruthy();
    expect(screen.queryByText('後台導覽')).toBeNull();
  });

  it('renders sidebar layout on dashboard routes', () => {
    mockUseRouterState.mockImplementation((options) =>
      options.select({ location: { pathname: '/dashboard' } }),
    );
    mockUseAuthSessionState.mockReturnValue({ status: 'authenticated' });

    render(
      <AppChrome>
        <div>Dashboard Content</div>
      </AppChrome>,
    );

    expect(screen.getByText('後台導覽')).toBeTruthy();
    expect(screen.getByText('Dashboard Content')).toBeTruthy();
    expect(screen.queryByRole('button', { name: '登入' })).toBeNull();
    expect(screen.queryByRole('main')).toBeNull();
  });
});
