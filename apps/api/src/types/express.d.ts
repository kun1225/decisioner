import type { AccessTokenPayload } from '@repo/auth/types';

declare global {
  namespace Express {
    interface Request {
      user?: AccessTokenPayload;
    }
  }
}
