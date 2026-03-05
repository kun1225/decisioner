import { useQueryClient } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import {
  useAuthSessionActions,
  useAuthSessionState,
} from '@/features/auth/_domain/auth-session-provider';

import { getContext, Provider } from './index';

describe('providers index wiring', () => {
  it('provides both query client and auth session context', () => {
    const context = getContext();

    const wrapper = ({ children }: { children: ReactNode }) => (
      <Provider context={context}>{children}</Provider>
    );

    const { result } = renderHook(
      () => ({
        queryClient: useQueryClient(),
        state: useAuthSessionState(),
        actions: useAuthSessionActions(),
      }),
      { wrapper },
    );

    expect(result.current.queryClient).toBe(context.queryClient);
    expect(result.current.state).toEqual({ status: 'unknown' });

    act(() => {
      result.current.actions.setAnonymous();
    });

    expect(result.current.state).toEqual({ status: 'anonymous' });
  });
});

describe('auth bridge via getContext()', () => {
  it('getAuthSessionState starts as unknown', () => {
    const context = getContext();
    expect(context.getAuthSessionState()).toEqual({ status: 'unknown' });
  });

  it('onAuthStateChange updates getAuthSessionState ref', () => {
    const context = getContext();

    context.onAuthStateChange({
      status: 'authenticated',
      accessToken: 'tok',
      user: { id: 'u1', email: 'a@b.com', name: 'A' },
    });

    expect(context.getAuthSessionState()).toEqual({
      status: 'authenticated',
      accessToken: 'tok',
      user: { id: 'u1', email: 'a@b.com', name: 'A' },
    });
  });

  it('waitForAuthReady resolves after non-unknown state', async () => {
    const context = getContext();

    let resolved = false;
    const promise = context.waitForAuthReady().then(() => {
      resolved = true;
    });

    expect(resolved).toBe(false);

    context.onAuthStateChange({ status: 'anonymous' });
    await promise;

    expect(resolved).toBe(true);
  });

  it('waitForAuthReady resets when state returns to unknown', async () => {
    const context = getContext();

    // First resolve
    context.onAuthStateChange({ status: 'anonymous' });
    await context.waitForAuthReady();

    // Reset to unknown
    context.onAuthStateChange({ status: 'unknown' });

    let resolved = false;
    const promise = context.waitForAuthReady().then(() => {
      resolved = true;
    });

    // Should be pending again
    await Promise.resolve();
    expect(resolved).toBe(false);

    // Resolve again
    context.onAuthStateChange({
      status: 'authenticated',
      accessToken: 'tok2',
      user: { id: 'u2', email: 'b@c.com', name: 'B' },
    });
    await promise;
    expect(resolved).toBe(true);
  });
});
