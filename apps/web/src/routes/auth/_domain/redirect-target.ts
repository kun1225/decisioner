export const DEFAULT_POST_AUTH_REDIRECT = '/dashboard';

export function sanitizeRedirectTarget(
  input?: string | null,
): string | null {
  if (typeof input !== 'string') {
    return null;
  }

  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }

  if (!trimmed.startsWith('/')) {
    return null;
  }

  if (trimmed.startsWith('//')) {
    return null;
  }

  return trimmed;
}

export function resolvePostAuthRedirect(input?: string | null): string {
  return sanitizeRedirectTarget(input) ?? DEFAULT_POST_AUTH_REDIRECT;
}

export function buildAuthRedirectSearch(input?: string | null) {
  const redirect = sanitizeRedirectTarget(input);
  if (!redirect) {
    return {};
  }

  return { redirect };
}
