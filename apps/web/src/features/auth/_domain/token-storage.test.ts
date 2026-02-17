import { afterEach, describe, expect, it } from 'vitest';

import {
  clearAccessToken,
  getAccessToken,
  setAccessToken,
  tokenStorage,
} from './token-storage';

describe('token-storage', () => {
  afterEach(() => {
    clearAccessToken();
    localStorage.clear();
  });

  it('stores and retrieves access token', () => {
    setAccessToken('access-123');

    expect(getAccessToken()).toBe('access-123');
    expect(localStorage.getItem('auth.access-token')).toBe('access-123');
  });

  it('clears token from memory and localStorage', () => {
    setAccessToken('access-123');
    clearAccessToken();

    expect(getAccessToken()).toBeNull();
    expect(localStorage.getItem('auth.access-token')).toBeNull();
  });

  it('exposes immutable tokenStorage API', () => {
    expect(Object.isFrozen(tokenStorage)).toBe(true);
  });
});
