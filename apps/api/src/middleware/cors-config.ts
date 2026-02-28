import type { CorsOptions } from 'cors';

const DEFAULT_ALLOWED_ORIGINS = ['http://localhost:3000', 'http://localhost:3001'];

export function parseAllowedOrigins(rawValue?: string): string[] {
  if (!rawValue?.trim()) {
    return [...DEFAULT_ALLOWED_ORIGINS];
  }

  return rawValue
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

export function createCorsOptions(
  rawAllowedOrigins = process.env.CORS_ALLOWED_ORIGINS,
): CorsOptions {
  const allowedOrigins = new Set(parseAllowedOrigins(rawAllowedOrigins));

  return {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  };
}
