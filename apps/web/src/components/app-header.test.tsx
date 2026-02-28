import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AppHeader } from './app-header';

describe('app-header', () => {
  it('shows logo and login link for anonymous users', () => {
    render(
      <AppHeader isAuthenticated={false} logoHref="/" primaryHref="/auth/login" />,
    );

    const logoLink = screen.getByText('Joy Gym').closest('a');
    const loginLink = screen.getByText('Login').closest('a');

    expect(logoLink?.getAttribute('href')).toBe('/');
    expect(loginLink?.getAttribute('href')).toBe('/auth/login');
  });

  it('shows dashboard link for authenticated users', () => {
    render(
      <AppHeader
        isAuthenticated
        logoHref="/"
        primaryHref="/dashboard"
      />,
    );

    const dashboardLink = screen.getByText('Dashboard').closest('a');
    expect(dashboardLink?.getAttribute('href')).toBe('/dashboard');
  });
});
