import type { AuthSessionState } from './auth-types';

export function createAuthReadyGate() {
  let resolve: (() => void) | null = null;
  let promise = new Promise<void>((r) => {
    resolve = r;
  });

  return {
    wait: () => promise,
    onStateChange: (status: AuthSessionState['status']) => {
      if (status === 'unknown') {
        promise = new Promise<void>((r) => {
          resolve = r;
        });
      } else if (resolve) {
        resolve();
        resolve = null;
      }
    },
  };
}
