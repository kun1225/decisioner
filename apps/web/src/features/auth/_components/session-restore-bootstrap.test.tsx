import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SessionRestoreBootstrap } from './session-restore-bootstrap';

const useAuthSessionMock = vi.fn();
const useSessionRestoreMock = vi.fn();
const restoreMock = vi.fn();

vi.mock('../_domain/auth-session-store', () => ({
  useAuthSession: () => useAuthSessionMock(),
}));

vi.mock('../_domain/use-session-restore', () => ({
  useSessionRestore: () => useSessionRestoreMock(),
}));

describe('session-restore-bootstrap', () => {
  beforeEach(() => {
    useAuthSessionMock.mockReset();
    useSessionRestoreMock.mockReset();
    restoreMock.mockReset();
    useSessionRestoreMock.mockReturnValue(restoreMock);
  });

  it('triggers restore when state is idle', () => {
    useAuthSessionMock.mockReturnValue({
      state: { status: 'idle', user: null, accessToken: null },
    });

    render(
      <SessionRestoreBootstrap>
        <p>children</p>
      </SessionRestoreBootstrap>,
    );

    expect(restoreMock).toHaveBeenCalledTimes(1);
  });

  it('does not restore when already authenticated', () => {
    useAuthSessionMock.mockReturnValue({
      state: {
        status: 'authenticated',
        user: { id: 'u-1', email: 'joy@example.com', name: 'Joy' },
        accessToken: 'token-1',
      },
    });

    render(
      <SessionRestoreBootstrap>
        <p>children</p>
      </SessionRestoreBootstrap>,
    );

    expect(restoreMock).not.toHaveBeenCalled();
  });
});
