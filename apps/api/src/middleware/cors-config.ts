import type { CorsOptions } from 'cors';

const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
];

function normalizeOrigin(origin: string): string {
  return origin.trim().replace(/\/+$/, '');
}

function isLoopbackOrigin(origin: string): boolean {
  return /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i.test(origin);
}

export function parseAllowedOrigins(rawValue?: string): string[] {
  if (!rawValue?.trim()) {
    return DEFAULT_ALLOWED_ORIGINS.map(normalizeOrigin);
  }

  return rawValue
    .split(',')
    .map(normalizeOrigin)
    .filter((origin) => origin.length > 0);
}

function isAllowedOrigin(origin: string, allowedOrigins: Set<string>) {
  const normalizedOrigin = normalizeOrigin(origin);
  if (allowedOrigins.has(normalizedOrigin)) {
    return true;
  }

  return (
    process.env.NODE_ENV !== 'production' && isLoopbackOrigin(normalizedOrigin)
  );
}

export function createCorsOptions(
  rawAllowedOrigins = process.env.CORS_ALLOWED_ORIGINS,
): CorsOptions {
  const allowedOrigins = new Set(parseAllowedOrigins(rawAllowedOrigins));

  return {
    origin: (origin, callback) => {
      if (!origin || isAllowedOrigin(origin, allowedOrigins)) {
        callback(null, true);
        return;
      }

      callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  };
}
