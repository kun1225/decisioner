export type AuthUser = {
  id: string;
  email: string;
  name: string;
};

export type AuthStatus = 'idle' | 'restoring' | 'authenticated' | 'guest';

export type AuthSession = {
  user: AuthUser;
  accessToken: string;
};

function isString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

export function isAuthUser(value: unknown): value is AuthUser {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    isString(candidate.id) &&
    isString(candidate.email) &&
    isString(candidate.name)
  );
}

export function normalizeAuthUser(value: unknown): AuthUser {
  if (!isAuthUser(value)) {
    throw new Error('Invalid auth user payload');
  }

  return {
    id: value.id,
    email: value.email,
    name: value.name,
  };
}
