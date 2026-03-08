# PR-4: Auth Integration Tests

## Context

G-18 的 PR-1~PR-3 已完成 auth 功能實作（register/login/refresh/logout/me、token rotation、reuse detection、route guard）。目前所有測試皆為 unit test（mock DB），缺少對真實 DB 的整合測試。PR-4 的目標是補齊 API 整合測試，驗證完整的 auth 流程、安全旗標、以及失敗路徑。

**E2E 測試不在本 PR 範圍**：Playwright 基礎建設（config、CI、雙 server 啟動）會超過 500 行限制，且目前 frontend unit tests 已覆蓋 session restore 邏輯。E2E 留給後續 PR。

## Plan

### Step 1: Install test dependencies

`apps/api/package.json` 新增 devDependencies：

- `supertest`
- `@types/supertest`

```bash
pnpm --filter api add -D supertest @types/supertest
```

> [REVIEW - 要修改]
> 這裡的依賴列表不完整。Step 2 明確要在 `apps/api` 的測試 helper 內直接使用 `pg` 與 `drizzle-orm/node-postgres/migrator`，但目前只安裝了 `supertest`。在 pnpm workspace 下，`apps/api` 直接 import 未宣告的套件，不能假設可透過 `@repo/database` 的 transitive dependency 正常解析。
>
> 原因：
>
> - `apps/api` 目前沒有直接宣告 `pg`
> - `apps/api` 目前也沒有直接宣告 `drizzle-orm`
> - 如果 helper 放在 `apps/api/src/test-utils/`，這兩個套件都應該是 `apps/api` 自己的依賴
>
> 建議解法：
> 把 DB setup helper 移到 `packages/database`，由該 package 負責 `pg` / migration import，`apps/api` 只 consume helper

### Step 2: Create test DB helper

**New file:** `apps/api/src/test-utils/setup-test-db.ts` (~70 lines)

職責：

1. 設定 env vars（`DATABASE_URL` 指向 `joygym_test`、`ACCESS_TOKEN_SECRET`、`REFRESH_TOKEN_SECRET`、`NODE_ENV=test`）
2. 使用 `pg` client 建立 test database（if not exists）
3. 使用 `drizzle-orm/node-postgres/migrator` 的 `migrate()` 跑 migrations
4. Export helpers：
   - `setupTestDb()` — beforeAll：建 DB + migrate
   - `truncateTables()` — afterEach：`TRUNCATE users, refresh_tokens CASCADE`
   - `closeTestDb()` — afterAll：關閉連線
   - `createTestAgent()` — 回傳 `supertest(createApp())`
5. Export `extractCookie(res, name)` — 從 `Set-Cookie` header 解析指定 cookie 的 value
6. Export `parseCookieFlags(res, name)` — 解析 cookie 的 flags（HttpOnly、SameSite 等）

**關鍵設計決策：**

- `DATABASE_URL` 必須在任何 `@repo/database/index` import 之前設定，因為 `db` singleton 在 module load 時就建立
- 使用 `pg` 原生 client 建 test DB，再用 drizzle `migrate()` 套 schema
- migrations 路徑：`packages/database/drizzle/`

> [REVIEW - 要修改]
> 這段有講到 import 順序風險，但目前 plan 還不夠具體，照字面實作很容易失敗。只要 `setup-test-db.ts` 或測試檔在 top-level import `createApp()` / `auth.service.ts` / `@repo/database/index`，`DATABASE_URL` 就會在 env 設定前被讀走，整個測試會鎖定到錯的 DB 或直接在 module load 階段炸掉。
>
> 原因：
>
> - `packages/database/src/index.ts` 在 import 時就建立 `db`
> - `createApp()` 會一路 import 到 routes/controller/service，最後碰到 `db` singleton
> - 目前 plan 沒有規定要用 dynamic import 或 Vitest setup file 來保證順序
>
> 建議解法：
>
> 在 `vitest.config.ts` 加 `setupFiles`，先統一設定 test env，再讓測試檔 import app

> [REVIEW - 要修改]
> `createTestAgent()` 若只是回傳 `supertest(createApp())`，後面的 refresh / logout / reuse detection 會很脆弱，因為這些流程仰賴 cookie 在多次 request 間延續。
>
> 原因：
>
> - `supertest()` 本身不保證像瀏覽器一樣自動保存 cookie jar
> - 你的測試案例 10~17 都是多步驟流程，若沒有 agent 或手動 cookie plumbing，測試會變得很冗長且容易漏掉 header/cookie
>
> 建議解法：
>
> - 把 helper 改成回傳 `supertest.agent(app)`
> - 若某些案例需要刻意重放舊 token，再額外提供 `extractCookie()` 讓測試能手動覆寫 `Cookie` header

### Step 3: Write integration tests (TDD — tests should pass since impl exists)

> [REVIEW - 要修改]
> 這個標題和 TDD workflow 衝突。倉庫規範要求的是先 RED 再 GREEN；「tests should pass since impl exists」會讓實作流程變成事後補測，而不是 test-first。
>
> 原因：
>
> - `AGENTS.md` / `CLAUDE.md` 都把 TDD 寫成強制流程
> - 即使 auth 功能已存在，這個 PR 新增的 test helper、測試 harness、整合測試案例本身仍然可以先 RED
>
> 建議解法：
>
> - 把這段改成兩步：先寫 1~2 個關鍵 happy path / failure path 測試並確認失敗，再補 helper 與其餘案例

**New file:** `apps/api/src/modules/auth/auth.integration.test.ts` (~300 lines)

```
describe('Auth API Integration')

  // Setup
  // beforeAll: setupTestDb(), createTestAgent()
  // afterEach: truncateTables()
  // afterAll: closeTestDb()

  describe('POST /api/auth/register')
    1. 201 + returns user & accessToken
    2. sets refresh_token cookie: httpOnly, sameSite=Strict, path=/api/auth
    3. sets session_presence cookie: httpOnly, sameSite=Strict, path=/
    4. 409 when email already registered
    5. 400 on invalid input (weak password)

  describe('POST /api/auth/login')
    6. 200 + returns accessToken on valid credentials
    7. sets refresh_token & session_presence cookies
    8. 401 on wrong password
    9. 401 on non-existent email

  describe('POST /api/auth/refresh')
    10. 200 + returns new accessToken with valid refresh cookie
    11. new refresh cookie value differs from old (rotation)
    12. 401 when no refresh cookie
    13. clears both cookies on 401

  describe('POST /api/auth/refresh — reuse detection')
    14. 使用已 rotated 的 old token → 401 + revoke entire family
    15. reuse 後，即使最新的合法 token 也被 revoke

  describe('POST /api/auth/logout')
    16. 204 + clears both cookies
    17. logout 後，用 old refresh token refresh → 401

  describe('GET /api/auth/me')
    18. 200 + returns user data with valid access token
    19. response 不含 hashedPassword 和 googleSub
    20. 401 without Authorization header
    21. 401 with invalid token
```

> [REVIEW - 要修改]
> `refresh` 的失敗路徑覆蓋還不夠，少了一個高風險案例：cookie 存在，但 refresh token 本身是 malformed / expired。這和「沒有 cookie」或「rotated token reuse」是不同分支，而且目前 controller 很可能在這個情境下回 500 並且不清 cookie。
>
> 原因：
>
> - `refresh()` 只在 `ApiError(401)` 時清 cookie
> - `verifyRefreshToken()` 丟出的 JWT 錯誤不是 `ApiError`
> - 如果不把這個案例寫進 plan，PR-4 很可能錯過一個真正的安全與行為缺陷
>
> 建議解法：
>
> - 在 `POST /api/auth/refresh` 區段新增案例：
>   - malformed token -> 應回 401
>   - expired token -> 應回 401
>   - 上述兩者都應清除 `refresh_token` 與 `session_presence`
> - 實作上，建議在 `auth.service.ts` 的 `rotateRefreshToken()` 內先包住 `verifyRefreshToken(oldToken)`，把 JWT library 丟出的 malformed / expired 錯誤統一轉成 `ApiError(401, 'Invalid refresh token')`
> - 這樣 `auth.controller.ts` 既有的 `catch` 才會進入 `error instanceof ApiError && error.statusCode === 401` 分支，正確清除兩個 cookie，最後由 error handler 回 `401`
> - 如果現況測試跑出 500，就把它當成 PR-4 要一起修的 integration bug，而不是調整測試去配合

### Step 4: Run and verify

```bash
# 需要 Docker PostgreSQL running
docker compose up -d

# 跑整合測試
cd apps/api && npx vitest run src/modules/auth/auth.integration.test.ts

# 確認既有 unit tests 不受影響
pnpm --filter api test
```

> [REVIEW - 要修改]
> 驗證步驟少了 coverage 檢查，也沒有處理 DB readiness。以目前 repo 規範，這兩件事都不應省略。
>
> 原因：
>
> - 倉庫要求 changed/new modules 維持 80%+ coverage
> - `docker compose up -d` 不代表 PostgreSQL 已經可接受連線，migration/test 可能 race fail
>
> 建議解法：
>
> - 補一條 coverage 驗證指令，或至少在 plan 中明寫「若現有 vitest config 未開 coverage，這個 PR 需補齊或在 PR 說明中標示待補」
> - 補一個 readiness step，例如等待 DB healthcheck 成功後再跑 migrate/test

## Line Budget

| File                                                 | Est. Lines |
| ---------------------------------------------------- | ---------- |
| `apps/api/package.json` (2 deps)                     | +2         |
| `apps/api/src/test-utils/setup-test-db.ts`           | ~70        |
| `apps/api/src/modules/auth/auth.integration.test.ts` | ~300       |
| **Total**                                            | **~372**   |

在 500 行限制內。

> [REVIEW]
>
> - 若預估會逼近 500 行，先規劃可拆分點，例如「test infra」與「auth integration cases」分兩個 PR

## Files to Modify/Create

- **Modify:** `apps/api/package.json` — add supertest devDeps
- **Create:** `apps/api/src/test-utils/setup-test-db.ts` — test DB lifecycle + helpers
- **Create:** `apps/api/src/modules/auth/auth.integration.test.ts` — 21 integration test cases

## Key Files to Reference

- `apps/api/src/app.ts` — `createApp()` factory (supertest 入口)
- `apps/api/src/modules/auth/auth.controller.ts` — cookie 設定邏輯
- `apps/api/src/modules/auth/auth.service.ts` — rotation/reuse 邏輯
- `packages/database/src/index.ts` — DB singleton（env-based）
- `packages/database/drizzle/` — migration files
- `packages/auth/src/jwt.ts` — token sign/verify
