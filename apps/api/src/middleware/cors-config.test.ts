import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createCorsOptions, parseAllowedOrigins } from './cors-config.js';

type OriginCallback = (error: Error | null, allowed?: boolean) => void;
type OriginResolver = (
  origin: string | undefined,
  callback: OriginCallback,
) => void;

function getOriginResolver(
  rawOrigin: ReturnType<typeof createCorsOptions>['origin'],
) {
  if (typeof rawOrigin !== 'function') {
    throw new TypeError('Expected CORS origin resolver to be a function');
  }

  return rawOrigin as OriginResolver;
}

function resolveOriginAllowance(
  originResolver: OriginResolver,
  origin: string | undefined,
) {
  return new Promise<boolean | undefined>((resolve, reject) => {
    originResolver(origin, (error, allowed) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(allowed);
    });
  });
}

describe('cors-config', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it('falls back to localhost dev origins when env is empty', () => {
    expect(parseAllowedOrigins(undefined)).toEqual([
      'http://localhost:3000',
      'http://localhost:3001',
    ]);
  });

  it('normalizes comma-separated origins', () => {
    expect(
      parseAllowedOrigins(
        'https://app.example.com/, https://admin.example.com  , ',
      ),
    ).toEqual(['https://app.example.com', 'https://admin.example.com']);
  });

  it('allows localhost origins in non-production mode', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    const options = createCorsOptions('https://app.example.com');
    const originResolver = getOriginResolver(options.origin);

    const allowed = await resolveOriginAllowance(
      originResolver,
      'http://localhost:3999',
    );

    expect(allowed).toBe(true);
  });

  it('requires explicit allowlist in production mode', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const options = createCorsOptions('https://app.example.com');
    const originResolver = getOriginResolver(options.origin);

    const allowed = await resolveOriginAllowance(
      originResolver,
      'https://app.example.com/',
    );
    const blocked = await resolveOriginAllowance(
      originResolver,
      'http://localhost:3001',
    );

    expect(allowed).toBe(true);
    expect(blocked).toBe(false);
  });
});
