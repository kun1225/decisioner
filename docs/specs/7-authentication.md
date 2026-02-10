# 7. Authentication

## Overview

使用 DIY 方式實作驗證：bcrypt（本地帳密）+ Google Identity（Google 登入）+ jsonwebtoken（JWT token）。
採用雙 token 模型：

- Access Token（短效，JWT，stateless）
- Refresh Token（長效，JWT + DB 儲存/輪替，stateful）

Access Token 只用於 API 授權；Refresh Token 只用於換發新 Access Token，且每次 refresh 都會 rotation。

## Identity Providers

- `LOCAL`: email + password（bcrypt）
- `GOOGLE`: Google `idToken`（由後端驗證）

## JWT Configuration

```typescript
// packages/auth/src/jwt.ts
import jwt from 'jsonwebtoken'
import { randomUUID } from 'crypto'

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET!
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET!

export interface AccessTokenPayload {
  userId: string
  email: string
}

export interface RefreshTokenPayload {
  userId: string
  jti: string
  familyId: string
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: '15m' })
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, ACCESS_TOKEN_SECRET) as AccessTokenPayload
}

export function signRefreshToken(userId: string, familyId: string): string {
  const payload: RefreshTokenPayload = { userId, jti: randomUUID(), familyId }
  return jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: '30d' })
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, REFRESH_TOKEN_SECRET) as RefreshTokenPayload
}
```

## Refresh Token Storage

Refresh Token 不儲存明文，只儲存雜湊值（`sha256(token)`），並以 `jti` / `family_id` 管理輪替與撤銷。

```sql
-- apps/api
create table refresh_tokens (
  id uuid primary key,
  user_id uuid not null,
  jti text unique not null,
  family_id text not null,
  token_hash text not null,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  replaced_by_jti text,
  created_at timestamptz not null default now()
);
```

規則：

- `login/register/google-login` 建立新 `family_id`，簽發第一個 refresh token
- `refresh` 成功後，舊 token 標記為 `replaced_by_jti`，簽發新 token（rotation）
- 若偵測到已撤銷或已替換 token 被重複使用，整個 `family_id` 立刻撤銷（reuse detection）

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

## Google Token Verification

```typescript
// packages/auth/src/google.ts
import { OAuth2Client } from 'google-auth-library'

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID)

export interface GoogleProfile {
  sub: string
  email: string
  name?: string
  picture?: string
}

export async function verifyGoogleIdToken(idToken: string): Promise<GoogleProfile> {
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: GOOGLE_CLIENT_ID,
  })

  const payload = ticket.getPayload()
  if (!payload?.sub || !payload.email || !payload.email_verified) {
    throw new Error('Invalid Google identity token')
  }

  return {
    sub: payload.sub,
    email: payload.email,
    name: payload.name,
    picture: payload.picture,
  }
}
```

Google 登入安全規則：

- 必須驗證 `aud`（client id）、`iss`、`exp`
- 只接受 `email_verified = true`
- 不儲存 Google `idToken`，只用來交換本系統 token
- `POST /api/auth/google` 需套用 rate limit

## Auth Middleware

```typescript
// apps/api/src/middleware/auth.middleware.ts
import { verifyAccessToken } from '@repo/auth'

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
    const payload = verifyAccessToken(token)
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
  → Sign access token + refresh token
  → Persist refresh token hash (new family_id)
  → Set refresh_token cookie (HttpOnly, Secure, SameSite=Strict)
  → Return { user, accessToken }
```

**Login:**

```
POST /api/auth/login { email, password }
  → Find user by email
  → Verify password (bcrypt)
  → Sign access token + refresh token
  → Persist refresh token hash (new family_id)
  → Set refresh_token cookie (HttpOnly, Secure, SameSite=Strict)
  → Return { user, accessToken }
```

**Google Login:**

```
POST /api/auth/google { idToken }
  → Verify Google idToken (aud/iss/exp/email_verified)
  → Find user by google_sub OR verified email
  → If user not exists, create user (provider=GOOGLE)
  → If LOCAL user with same verified email, link google_sub
  → Sign access token + refresh token
  → Persist refresh token hash (new family_id)
  → Set refresh_token cookie (HttpOnly, Secure, SameSite=Strict)
  → Return { user, accessToken }
```

**Refresh (Token Rotation):**

```
POST /api/auth/refresh (Cookie: refresh_token=<token>)
  → Verify refresh token signature & expiry
  → Lookup by jti + token hash + not revoked
  → Revoke old token row (set replaced_by_jti)
  → Sign new refresh token (new jti, same family_id)
  → Persist new token hash
  → Sign new access token
  → Replace refresh_token cookie
  → Return { accessToken }
```

**Reuse Detection:**

```
POST /api/auth/refresh with old/revoked refresh token
  → Token row already revoked/replaced
  → Mark all tokens in same family_id as revoked
  → Clear refresh_token cookie
  → Return 401 (force re-login)
```

**Logout:**

```
POST /api/auth/logout
  → Revoke current refresh token (or whole family for logout-all)
  → Clear refresh_token cookie
  → Return 204
```

**Authenticated Request:**

```
GET /api/decisions (Authorization: Bearer <accessToken>)
  → Auth middleware extracts token
  → Verify access token signature & expiry
  → Inject user payload into req.user
  → Proceed to controller
```
