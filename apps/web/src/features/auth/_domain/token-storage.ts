const ACCESS_TOKEN_KEY = 'auth.access-token';

let memoryToken: string | null = null;

function canUseLocalStorage() {
  return (
    typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
  );
}

function readFromStorage() {
  if (!canUseLocalStorage()) {
    return null;
  }

  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getAccessToken(): string | null {
  return memoryToken ?? readFromStorage();
}

export function setAccessToken(accessToken: string): void {
  memoryToken = accessToken;

  if (canUseLocalStorage()) {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  }
}

export function clearAccessToken(): void {
  memoryToken = null;

  if (canUseLocalStorage()) {
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  }
}

export const tokenStorage = Object.freeze({
  getAccessToken,
  setAccessToken,
  clearAccessToken,
});
