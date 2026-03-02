import { fireEvent } from '@testing-library/dom';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { DashboardLayout } from './dashboard-layout';

const mockUseNavigate = vi.fn();
const mockUseAuthSessionState = vi.fn();

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockUseNavigate,
}));

vi.mock('@/features/auth/_domain/auth-session-provider', () => ({
  useAuthSessionState: () => mockUseAuthSessionState(),
}));

describe('dashboard-layout', () => {
  it('renders sidebar and dashboard content', () => {
    mockUseAuthSessionState.mockReturnValue({ status: 'authenticated' });

    render(
      <DashboardLayout>
        <div>Dashboard Content</div>
      </DashboardLayout>,
    );

    expect(screen.getByText('後台導覽')).toBeTruthy();
    expect(screen.getByText('Dashboard Content')).toBeTruthy();
  });

  it('navigates to home when authenticated user clicks sidebar auth action', () => {
    mockUseAuthSessionState.mockReturnValue({ status: 'authenticated' });

    render(
      <DashboardLayout>
        <div>Dashboard Content</div>
      </DashboardLayout>,
    );

    fireEvent.click(screen.getByRole('button', { name: '前往前台' }));

    expect(mockUseNavigate).toHaveBeenCalledWith({ to: '/' });
  });

  it('navigates to login with dashboard redirect for anonymous user', () => {
    mockUseAuthSessionState.mockReturnValue({ status: 'anonymous' });

    render(
      <DashboardLayout>
        <div>Dashboard Content</div>
      </DashboardLayout>,
    );

    fireEvent.click(screen.getByRole('button', { name: '登入' }));

    expect(mockUseNavigate).toHaveBeenCalledWith({
      to: '/auth/login',
      search: {
        redirect: '/dashboard',
      },
    });
  });
});
