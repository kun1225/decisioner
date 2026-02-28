import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createCorsOptions, parseAllowedOrigins } from './cors-config.js';

function resolveOriginAllowance(
  originResolver: NonNullable<ReturnType<typeof createCorsOptions>['origin']>,
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
    const originResolver = options.origin;

    expect(typeof originResolver).toBe('function');

    const allowed = await resolveOriginAllowance(
      originResolver as NonNullable<typeof originResolver>,
      'http://localhost:3999',
    );

    expect(allowed).toBe(true);
  });

  it('requires explicit allowlist in production mode', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const options = createCorsOptions('https://app.example.com');
    const originResolver = options.origin;

    expect(typeof originResolver).toBe('function');

    const allowed = await resolveOriginAllowance(
      originResolver as NonNullable<typeof originResolver>,
      'https://app.example.com/',
    );
    const blocked = await resolveOriginAllowance(
      originResolver as NonNullable<typeof originResolver>,
      'http://localhost:3001',
    );

    expect(allowed).toBe(true);
    expect(blocked).toBe(false);
  });
});
