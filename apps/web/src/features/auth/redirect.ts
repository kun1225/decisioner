export function sanitizeRedirectTarget(raw?: string): string {
  if (!raw) {
    return '/'
  }

  if (!raw.startsWith('/') || raw.startsWith('//')) {
    return '/'
  }

  return raw
}
