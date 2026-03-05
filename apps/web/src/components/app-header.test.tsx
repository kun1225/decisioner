import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AppHeader } from './app-header';

describe('app-header', () => {
  it('shows logo and login link for anonymous users', () => {
    render(
      <AppHeader
        authStatus="anonymous"
        logoHref="/"
        primaryHref="/auth/login"
      />,
    );

    const logoLink = screen.getByText('Joy Gym').closest('a');
    const loginLink = screen.getByText('Login').closest('a');

    expect(logoLink?.getAttribute('href')).toBe('/');
    expect(loginLink?.getAttribute('href')).toBe('/auth/login');
  });

  it('shows disabled placeholder for unknown auth status', () => {
    render(
      <AppHeader authStatus="unknown" logoHref="/" primaryHref="/auth/login" />,
    );

    const placeholder = screen.getByText('...');
    expect(placeholder.closest('button')?.disabled).toBe(true);
  });

  it('shows user name for authenticated users', () => {
    render(
      <AppHeader
        authStatus="authenticated"
        userName="Alice"
        logoHref="/"
        primaryHref="/dashboard"
      />,
    );

    expect(screen.getByText('Alice')).toBeTruthy();
  });
});
