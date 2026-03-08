import { fireEvent } from '@testing-library/dom';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { DashboardLayout } from './dashboard-layout';

const mockNavigate = vi.fn().mockResolvedValue(undefined);
const mockUseAuthSessionState = vi.fn();
const mockSetAnonymous = vi.fn();

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('@/features/auth/_domain/auth-session-provider', () => ({
  useAuthSessionState: () => mockUseAuthSessionState(),
  useAuthSessionActions: () => ({
    setAnonymous: mockSetAnonymous,
    setAuthenticated: vi.fn(),
    setUnknown: vi.fn(),
  }),
}));

vi.mock('@/features/auth/_domain/auth-client', () => ({
  logout: vi.fn().mockResolvedValue(undefined),
}));

describe('dashboard-layout', () => {
  it('renders sidebar and dashboard content', () => {
    mockUseAuthSessionState.mockReturnValue({
      status: 'authenticated',
      accessToken: 'tok',
      user: { id: 'u1', email: 'a@b.com', name: 'Alice' },
    });

    render(
      <DashboardLayout>
        <div>Dashboard Content</div>
      </DashboardLayout>,
    );

    expect(screen.getByText('後台導覽')).toBeTruthy();
    expect(screen.getByText('Dashboard Content')).toBeTruthy();
    expect(screen.getByText('Alice')).toBeTruthy();
  });

  it('shows logout button and calls setAnonymous on click', async () => {
    mockUseAuthSessionState.mockReturnValue({
      status: 'authenticated',
      accessToken: 'tok',
      user: { id: 'u1', email: 'a@b.com', name: 'Alice' },
    });

    render(
      <DashboardLayout>
        <div>Content</div>
      </DashboardLayout>,
    );

    fireEvent.click(screen.getByRole('button', { name: '登出' }));

    await waitFor(() => {
      expect(mockSetAnonymous).toHaveBeenCalled();
    });
  });
});
