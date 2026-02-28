import { render, screen } from '@testing-library/react';
import { fireEvent } from '@testing-library/dom';
import { describe, expect, it } from 'vitest';

import { AppHeader } from './app-header';

describe('app-header', () => {
  it('shows logo and login button for anonymous users', () => {
    render(
      <AppHeader
        isAuthenticated={false}
        onLogoClick={() => {}}
        onPrimaryAction={() => {}}
      />,
    );

    expect(screen.getByText('JoyGym')).toBeTruthy();

    const loginButton = screen.getByRole('button', { name: '登入' });
    expect(loginButton).toBeTruthy();
  });

  it('shows go-to-dashboard button for authenticated users', () => {
    render(
      <AppHeader
        isAuthenticated
        onLogoClick={() => {}}
        onPrimaryAction={() => {}}
      />,
    );

    const dashboardButton = screen.getByRole('button', { name: '前往後台' });
    expect(dashboardButton).toBeTruthy();
  });

  it('fires callbacks when logo and action button are clicked', () => {
    let logoClicked = false;
    let actionClicked = false;

    render(
      <AppHeader
        isAuthenticated={false}
        onLogoClick={() => {
          logoClicked = true;
        }}
        onPrimaryAction={() => {
          actionClicked = true;
        }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'JoyGym' }));
    fireEvent.click(screen.getByRole('button', { name: '登入' }));

    expect(logoClicked).toBe(true);
    expect(actionClicked).toBe(true);
  });
});
