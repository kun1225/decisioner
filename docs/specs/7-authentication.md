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

## Token Contract

Access Token（JWT）：

- 用途：API 授權（`Authorization: Bearer <accessToken>`）
- 有效期：15 分鐘
- Claims：`userId`、`email`
- 性質：stateless，不落 DB

Refresh Token（JWT）：

- 用途：僅用於 `POST /api/auth/refresh`
- 有效期：30 天
- Claims：`userId`、`jti`、`familyId`
- 傳輸：`HttpOnly + Secure + SameSite=Strict` cookie（`refresh_token`）
- 儲存：僅儲存 `sha256(token)`，不儲存明文 token
- 狀態：透過 `refresh_tokens` table 管理（schema 見 `docs/specs/3-data-model.md`）

Rotation 規則：

- `login/register/google-login` 建立新 `familyId` 並簽發第一個 refresh token
- 每次 refresh 成功都撤銷舊 token、簽發新 token（new `jti`, same `familyId`）
- 偵測舊 token 重放（reuse）時，撤銷整個 token family 並要求重新登入

## Security Requirements

Local 帳密：

- 密碼必須使用 bcrypt 雜湊後儲存（不可明文）
- 驗證流程為：以 email 查 user，再比對輸入密碼與 `hashed_password`
- `GOOGLE` provider 帳號允許 `hashed_password = null`

Google 登入：

- 後端必須驗證 Google `idToken` 的 `aud`、`iss`、`exp`
- 只接受 `email_verified = true`
- 不儲存 Google `idToken`，只用來交換本系統 token
- `POST /api/auth/google` 需套用 rate limit

授權中介層：

- Bearer token 缺失或格式錯誤：視為未登入
- Access token 驗證失敗（簽章/過期）：視為未登入
- 受保護端點由 `requireAuth` 風格機制統一回傳 `401`

## Flow Diagrams

**Registration:**

```
POST /api/auth/register { email, password, name }
  → Validate input (Zod)
  → Check email uniqueness
  → Hash password (bcrypt)
  → Create user in database (provider=LOCAL)
  → Sign access token + refresh token
  → Persist refresh token hash (new familyId)
  → Set refresh_token cookie (HttpOnly, Secure, SameSite=Strict)
  → Return { user, accessToken }
```

**Login:**

```
POST /api/auth/login { email, password }
  → Find user by email
  → Ensure provider supports password login (LOCAL)
  → Verify password (bcrypt)
  → Sign access token + refresh token
  → Persist refresh token hash (new familyId)
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
  → Persist refresh token hash (new familyId)
  → Set refresh_token cookie (HttpOnly, Secure, SameSite=Strict)
  → Return { user, accessToken }
```

**Refresh (Token Rotation):**

```
POST /api/auth/refresh (Cookie: refresh_token=<token>)
  → Verify refresh token signature & expiry
  → Lookup by jti + token hash + not revoked
  → Revoke old token row (set replaced_by_jti)
  → Sign new refresh token (new jti, same familyId)
  → Persist new token hash
  → Sign new access token
  → Replace refresh_token cookie
  → Return { accessToken }
```

**Reuse Detection:**

```
POST /api/auth/refresh with old/revoked refresh token
  → Token row already revoked/replaced
  → Mark all tokens in same familyId as revoked
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
