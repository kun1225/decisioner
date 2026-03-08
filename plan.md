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

> [REVIEW - 已確認] 依賴列表不完整
>
> pnpm strict mode 下 `apps/api` 不能透過 `@repo/database` 的 transitive dep 使用 `pg` / `drizzle-orm`。
>
> **採用方案：** 將 DB setup helper（建 DB、migrate、truncate、close）放在 `packages/database/src/test-utils/` 內，由該 package 負責 `pg` / `drizzle-orm/node-postgres/migrator` import。`apps/api` 只 consume exported helper，不需額外安裝。

### Step 2: Create test helpers

#### 2a. DB lifecycle helper in `packages/database`

**New file:** `packages/database/src/test-utils/setup-test-db.ts` (~50 lines)

職責：

1. 使用 `pg.Client` 連線到預設 DB，`CREATE DATABASE joygym_test IF NOT EXISTS`
2. 使用 `drizzle-orm/node-postgres/migrator` 的 `migrate()` 跑 migrations（路徑 `packages/database/drizzle/`）
3. Export helpers：
   - `setupTestDb()` — beforeAll：建 DB + migrate（含 retry 等待 PG ready）
   - `truncateTables()` — afterEach：`TRUNCATE users, refresh_tokens CASCADE`
   - `closeTestDb()` — afterAll：關閉連線

> [REVIEW - 已確認] import 順序風險
>
> `packages/database/src/index.ts` 的 `db` singleton 在 module load 時建立。
>
> **採用方案：** 在 `apps/api/vitest.config.ts` 新增 `setupFiles` 指向一個 env setup file，在所有 import 之前設定 `DATABASE_URL=joygym_test`、`ACCESS_TOKEN_SECRET`、`REFRESH_TOKEN_SECRET`、`NODE_ENV=test`。既有 unit test 全部 mock `@repo/database/index`，不受 env 影響。

**New file:** `apps/api/src/test-utils/integration-env.ts` (~10 lines)

職責：設定 env vars，作為 vitest `setupFiles`。

**Modify:** `apps/api/vitest.config.ts` — 加 `test.setupFiles`

#### 2b. Supertest + cookie helpers in `apps/api`

**New file:** `apps/api/src/test-utils/test-agent.ts` (~30 lines)

職責：

1. `createTestAgent()` — 回傳 `supertest.agent(createApp())`（自動維護 cookie jar）
2. `extractCookie(res, name)` — 從 `Set-Cookie` header 解析指定 cookie value（用於 reuse detection 測試手動重放 old token）
3. `parseCookieFlags(res, name)` — 解析 cookie flags（HttpOnly、SameSite 等）

> [REVIEW - 已確認] supertest.agent 取代 supertest
>
> **採用方案：** 預設用 `supertest.agent(app)` 維護 cookie jar。reuse detection 測試需要手動重放 old token 時，用 `extractCookie()` 取值後搭配 `.set('Cookie', ...)` 覆寫。

### Step 3: Fix malformed/expired refresh token handling

> [REVIEW - 已確認] refresh 失敗路徑缺漏
>
> 驗證結果：`auth.service.ts:70` 的 `verifyRefreshToken(oldToken)` 丟出 `jwt.JsonWebTokenError`（非 `ApiError`），controller catch block 只比對 `ApiError(401)` 才清 cookie，所以 malformed/expired token 會：
>
> - 不清除 `refresh_token` 和 `session_presence` cookie
> - error handler 回 500 Internal Server Error
>
> 這是真實的安全與行為缺陷。

**修改方案：** 在 `auth.service.ts` 的 `rotateRefreshToken()` 內用 try-catch 包住 `verifyRefreshToken(oldToken)`，將 JWT library 的錯誤轉為 `ApiError(401, 'Invalid refresh token')`。這樣 controller 既有的 catch 分支就能正確清除 cookie 並回 401。

**Modify:** `apps/api/src/modules/auth/auth.service.ts` (~5 lines change)

### Step 4: Write integration tests

**New file:** `apps/api/src/modules/auth/auth.integration.test.ts` (~300 lines)

> [REVIEW - 不合理] TDD RED→GREEN 衝突
>
> **不採用原因：** TDD RED→GREEN 適用於功能開發（先寫測試、再寫實作）。本 PR 是對已存在的實作補寫整合測試，測試預期在第一次跑就通過（若實作正確）。刻意製造 RED phase（例如先寫測試但不建 helper）不增加價值，只增加流程摩擦。整合測試的真正 RED 場景是「測試跑出非預期結果」——如 Step 3 的 malformed token 回 500——那才是需要修復的。

```
describe('Auth API Integration')

  // Setup
  // beforeAll: setupTestDb()
  // beforeEach: createTestAgent() (fresh agent per test for isolation)
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
    13. clears both cookies on 401 (no cookie case)
    14. 401 + clears cookies when malformed token
    15. 401 + clears cookies when expired token

  describe('POST /api/auth/refresh — reuse detection')
    16. 使用已 rotated 的 old token → 401 + revoke entire family
    17. reuse 後，即使最新的合法 token 也被 revoke

  describe('POST /api/auth/logout')
    18. 204 + clears both cookies
    19. logout 後，用 old refresh token refresh → 401

  describe('GET /api/auth/me')
    20. 200 + returns user data with valid access token
    21. response 不含 hashedPassword 和 googleSub
    22. 401 without Authorization header
    23. 401 with invalid token
```

### Step 5: Run and verify

```bash
# 需要 Docker PostgreSQL running
docker compose up -d

# 跑整合測試
cd apps/api && npx vitest run src/modules/auth/auth.integration.test.ts

# 確認既有 unit tests 不受影響
pnpm --filter api test

# 全量測試
pnpm test
```

> [REVIEW - 部分合理] Coverage + DB readiness
>
> - **DB readiness：已確認。** `setupTestDb()` 內建 retry 機制等待 PG ready。
> - **Coverage 檢查：不採用。** 本 PR 只新增測試，不新增功能程式碼（Step 3 的 bug fix 僅 5 行）。coverage 只會增加不會減少。新增 coverage 工具（c8/istanbul）屬於獨立 scope，不在此 PR 處理。

## Line Budget

| File                                                 | Est. Lines |
| ---------------------------------------------------- | ---------- |
| `packages/database/src/test-utils/setup-test-db.ts`  | ~50        |
| `apps/api/src/test-utils/integration-env.ts`         | ~10        |
| `apps/api/src/test-utils/test-agent.ts`              | ~30        |
| `apps/api/vitest.config.ts` (modify)                 | +3         |
| `apps/api/src/modules/auth/auth.service.ts` (modify) | +5         |
| `apps/api/src/modules/auth/auth.integration.test.ts` | ~320       |
| `apps/api/package.json` (deps)                       | +2         |
| **Total**                                            | **~420**   |

在 500 行限制內。

> [REVIEW - 已確認] 拆分備案
>
> 若實作超過 500 行，以 test infra（Step 1-3）和 integration cases（Step 4）為拆分點。

## Files to Modify/Create

- **Create:** `packages/database/src/test-utils/setup-test-db.ts` — DB lifecycle helpers
- **Create:** `apps/api/src/test-utils/integration-env.ts` — vitest setupFiles env
- **Create:** `apps/api/src/test-utils/test-agent.ts` — supertest agent + cookie helpers
- **Create:** `apps/api/src/modules/auth/auth.integration.test.ts` — 23 integration test cases
- **Modify:** `apps/api/vitest.config.ts` — add setupFiles
- **Modify:** `apps/api/package.json` — add supertest devDeps
- **Modify:** `apps/api/src/modules/auth/auth.service.ts` — wrap verifyRefreshToken in try-catch

## Key Files to Reference

- `apps/api/src/app.ts` — `createApp()` factory (supertest 入口)
- `apps/api/src/modules/auth/auth.controller.ts` — cookie 設定邏輯，refresh catch 分支
- `apps/api/src/modules/auth/auth.service.ts` — rotation/reuse 邏輯，verifyRefreshToken 呼叫點
- `apps/api/src/middleware/error-handler.ts` — 錯誤分派（ApiError vs 500）
- `packages/database/src/index.ts` — DB singleton（env-based）
- `packages/database/drizzle/` — migration files
- `packages/auth/src/jwt.ts` — verifyRefreshToken 丟出的 JWT error 型別
