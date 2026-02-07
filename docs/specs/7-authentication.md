# 7. Authentication

## Overview

使用 DIY 方式實作驗證：bcrypt（密碼雜湊）+ jsonwebtoken（JWT token）。
JWT 為 stateless，不需要 sessions table。

## JWT Configuration

```typescript
// packages/auth/src/jwt.ts
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET!

export interface JwtPayload {
  userId: string
  email: string
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload
}
```

## Password Handling

```typescript
// packages/auth/src/password.ts
import bcrypt from 'bcrypt'

const SALT_ROUNDS = 12

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash)
}
```

## Auth Middleware

```typescript
// apps/api/src/middleware/auth.middleware.ts
import { verifyToken } from '@repo/auth'

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers.authorization

  if (!authHeader?.startsWith('Bearer ')) {
    req.user = null
    return next()
  }

  try {
    const token = authHeader.slice(7)
    const payload = verifyToken(token)
    req.user = payload
  } catch {
    req.user = null
  }

  next()
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    throw new ApiError(401, 'Authentication required')
  }
  next()
}
```

## Flow Diagrams

**Registration:**

```
POST /api/auth/register { email, password, name }
  → Validate input (Zod)
  → Check email uniqueness
  → Hash password (bcrypt)
  → Create user in database
  → Sign JWT token
  → Return { user, token }
```

**Login:**

```
POST /api/auth/login { email, password }
  → Find user by email
  → Verify password (bcrypt)
  → Sign JWT token
  → Return { user, token }
```

**Authenticated Request:**

```
GET /api/decisions (Authorization: Bearer <token>)
  → Auth middleware extracts token
  → Verify JWT signature & expiry
  → Inject user payload into req.user
  → Proceed to controller
```
