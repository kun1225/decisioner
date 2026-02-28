import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import { useAuthSessionActions } from '@/features/auth/_domain/auth-session-provider';

import { getRouter } from './router';

describe('router provider integration', () => {
  it('wraps routes with auth session provider', () => {
    const router = getRouter();
    const Wrap = router.options.Wrap;

    expect(Wrap).toBeTypeOf('function');

    const wrapper = ({ children }: { children: ReactNode }) => {
      if (!Wrap) {
        return <>{children}</>;
      }

      return <Wrap>{children}</Wrap>;
    };

    const { result } = renderHook(() => useAuthSessionActions(), {
      wrapper,
    });

    expect(result.current).toEqual({
      setAnonymous: expect.any(Function),
      setAuthenticated: expect.any(Function),
      setUnknown: expect.any(Function),
    });
  });
});
