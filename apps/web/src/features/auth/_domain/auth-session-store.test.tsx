import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderWithProviders } from '@/lib/render-with-providers';

import { AuthSessionProvider, useAuthSession } from './auth-session-store';

function SessionFixture() {
  const { state, setAuthenticated, setGuest, setRestoring } = useAuthSession();

  return (
    <div>
      <p data-testid="status">{state.status}</p>
      <button
        type="button"
        onClick={() =>
          setAuthenticated({
            accessToken: 'token-1',
            user: { id: 'u-1', email: 'joy@example.com', name: 'Joy' },
          })
        }
      >
        auth
      </button>
      <button type="button" onClick={setRestoring}>
        restoring
      </button>
      <button type="button" onClick={setGuest}>
        guest
      </button>
    </div>
  );
}

describe('auth-session-store', () => {
  it('updates status across restore/auth/guest transitions', () => {
    renderWithProviders(
      <AuthSessionProvider>
        <SessionFixture />
      </AuthSessionProvider>,
    );

    expect(screen.getByTestId('status').textContent).toBe('idle');
    fireEvent.click(screen.getByText('restoring'));
    expect(screen.getByTestId('status').textContent).toBe('restoring');
    fireEvent.click(screen.getByText('auth'));
    expect(screen.getByTestId('status').textContent).toBe('authenticated');
    fireEvent.click(screen.getByText('guest'));
    expect(screen.getByTestId('status').textContent).toBe('guest');
  });
});
