import { describe, expect, it } from 'vitest';

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
  it('falls back to localhost dev origins when env is empty', () => {
    expect(parseAllowedOrigins(undefined)).toEqual([
      'http://localhost:3000',
      'http://localhost:3001',
    ]);
  });

  it('parses comma-separated origins', () => {
    expect(
      parseAllowedOrigins(
        'https://app.example.com, https://admin.example.com  , ',
      ),
    ).toEqual(['https://app.example.com', 'https://admin.example.com']);
  });

  it('allows configured origins and blocks unknown origins', async () => {
    const options = createCorsOptions('http://localhost:3001');
    const originResolver = options.origin;

    expect(typeof originResolver).toBe('function');

    const allowed = await resolveOriginAllowance(
      originResolver as NonNullable<typeof originResolver>,
      'http://localhost:3001',
    );
    const blocked = await resolveOriginAllowance(
      originResolver as NonNullable<typeof originResolver>,
      'http://localhost:9999',
    );
    const withoutOrigin = await resolveOriginAllowance(
      originResolver as NonNullable<typeof originResolver>,
      undefined,
    );

    expect(allowed).toBe(true);
    expect(blocked).toBe(false);
    expect(withoutOrigin).toBe(true);
  });
});
