# PR-3: Session Restore, Guarded Routes, and Header Auth Actions

## Context

PR-1 established the auth API client and session state model (`unknown/authenticated/anonymous`). PR-2 added login/register pages. However, three critical gaps remain:

1. **No session restore** -- refreshing the page loses auth state (always starts `unknown`, never attempts recovery)
2. **No route guard** -- `/dashboard` is accessible to unauthenticated users
3. **No logout UI** -- header shows "Dashboard"/"Login" but has no logout action or user display

PR-3 closes these gaps to satisfy AC2 (auto-extend session), AC5 (session restore on reload), and AC6 (authorization boundaries).

---

## Key Architecture Decisions

### 1. Provider 集中原則（spec 4-frontend-architecture §4.2）

規格要求 `providers/index.tsx` 必須集中所有 providers，對外只匯出一個 `Provider`。

目前 `AuthSessionProvider` 同時出現在 `providers/index.tsx` 和 `router.tsx` 的 `Wrap` 中，但 TanStack Start 實際只使用 `Wrap` 內的那一份（`Provider` 只在測試中被使用）。

**修正方案**：

- **`providers/index.tsx`** 仍為 provider 唯一管理處；`getContext()` 同時建立 auth bridge（ref + resettable promise）
- **`router.tsx`** 的 `Wrap` 改為使用 `Provider` 元件（而非直接 `AuthSessionProvider`），讓所有 provider 統一由 `providers/index.tsx` 管理
- `Provider` 接收完整 context（含 `onAuthStateChange`），內部傳遞給 `AuthSessionProvider`

### 2. Bridging React Context to Router `beforeLoad`

TanStack Router 的 `beforeLoad` 在 React component tree 外執行（無法使用 hooks）。為讓 route guard 讀取 auth state：

- 在 `getContext()` 中建立 `authSessionRef`（mutable ref）和 resettable `authReadyGate`
- 透過 `onAuthStateChange` callback 同步 ref 並控制 gate
- Router context 暴露 `getAuthSessionState()` 和 `waitForAuthReady()`
- `beforeLoad` 同步讀取或 await（若 `unknown`）

### 3. Resettable Auth Ready Gate

`waitForAuthReady` 設計為可重置 gate，非一次性 promise。當狀態回到 `unknown`（例如未來 token revalidation），promise 會重建；當狀態轉為非 `unknown` 時 resolve。

```typescript
function createAuthReadyGate() {
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
```

### 4. SSR 伺服器端驗證：`session_presence` cookie

#### 問題

後端 `refresh_token` cookie 的 `path=/api/auth`（`auth.controller.ts:25`），瀏覽器請求 `/dashboard` 時不會帶此 cookie，導致 SSR `beforeLoad` 永遠無法偵測到登入狀態。

#### 方案：新增 `session_presence` hint cookie

後端在 login/register/refresh 時額外設一顆 `session_presence` cookie（`Path=/`），SSR 用它做「快速擋未登入」。真正身份驗證仍靠 client 端 `refresh → me` 流程。

- **性質**：純 hint，非安全機制。偽造此 cookie 最多看到 loading skeleton，client guard 仍會擋下
- **屬性**：`Path=/`, `SameSite=strict`, `maxAge=30d`（與 refresh_token 同步），非 `httpOnly`
- **設定**：`register`、`login`、`refresh` handler 各加一行 set
- **清除**：`logout` handler 加一行 clear

#### SSR Guard 讀取方式

使用 `@tanstack/react-start/server` 的 `getCookie()`（專案已有 `@tanstack/react-start@^1.132.0`，該版本匯出 `getCookie` via `start-server-core`）。

為避免 server import 汙染 client bundle，用 `createServerFn` 包裝（符合專案既有模式，見 `data/demo.punk-songs.ts`）：

```typescript
import { createServerFn } from '@tanstack/react-start';
import { getCookie } from '@tanstack/react-start/server';

const checkSessionPresence = createServerFn({ method: 'GET' }).handler(
  async () => !!getCookie('session_presence'),
);
```

#### Guard 流程（fail-closed）

```
Server beforeLoad:
  ├─ checkSessionPresence() → false → redirect /auth/login（快速失敗）
  ├─ checkSessionPresence() → true  → 允許渲染（client 端驗證完整 auth）
  └─ checkSessionPresence() 失敗    → redirect /auth/login（fail-closed）

Client beforeLoad:
  ├─ unknown → await waitForAuthReady()
  └─ re-read → 非 authenticated → redirect /auth/login
```

---

## Implementation Plan

### Phase 1: Auth Ready Gate 工具 (TDD) ✅

**New: `apps/web/src/features/auth/_domain/auth-ready-gate.ts`** (~20 lines)

- 純函式 `createAuthReadyGate()` → `{ wait, onStateChange }`
- 可重置 promise：unknown 時重建、非 unknown 時 resolve

**New: `apps/web/src/features/auth/_domain/auth-ready-gate.test.ts`** (~40 lines)

- 初始 wait 為 pending
- 呼叫 onStateChange('authenticated') → wait resolves
- 再呼叫 onStateChange('unknown') → wait 重新回到 pending
- 再呼叫 onStateChange('anonymous') → 新的 wait resolves

### Phase 2: Session Restore Hook (TDD) ✅

**New: `apps/web/src/features/auth/_domain/use-session-restore.ts`** (~35 lines)

- Hook: `useSessionRestore(actions: Pick<AuthSessionActions, 'setAuthenticated' | 'setAnonymous'>)`
- On mount: `refresh()` → `me(accessToken)` → `setAuthenticated({ accessToken, user })`
- On any error: `setAnonymous()`
- Ref guard to prevent double-execution in React StrictMode

**New: `apps/web/src/features/auth/_domain/use-session-restore.test.ts`** (~80 lines)

- refresh success + me success → setAuthenticated
- refresh 401 → setAnonymous
- me failure after refresh success → setAnonymous
- StrictMode double-mount → only runs once

### Phase 3: Logout Hook (TDD) ✅

**New: `apps/web/src/features/auth/_domain/use-logout.ts`** (~25 lines)

- Hook: `useLogout()` returns `{ handleLogout, isLoggingOut }`
- Flow: `logout()` API (best-effort) → `setAnonymous()` → navigate to `/`
- Even if API fails, still clears state and navigates

**New: `apps/web/src/features/auth/_domain/use-logout.test.ts`** (~50 lines)

- API success → setAnonymous + navigate
- API failure → still setAnonymous + navigate
- isLoggingOut flag transitions

### Phase 4: Backend - `session_presence` cookie ✅

**Modify: `apps/api/src/modules/auth/auth.controller.ts`** (+15 lines)

- 新增 `setSessionPresenceCookie(res)` 和 `clearSessionPresenceCookie(res)` 工具函式
- `register`、`login`、`refresh` handler 各加一行 `setSessionPresenceCookie(res)`
- `logout` handler 加一行 `clearSessionPresenceCookie(res)`

```typescript
const SESSION_PRESENCE_COOKIE = 'session_presence';

function setSessionPresenceCookie(res: Parameters<RequestHandler>[1]) {
  res.cookie(SESSION_PRESENCE_COOKIE, '1', {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: THIRTY_DAYS_MS,
  });
}

function clearSessionPresenceCookie(res: Parameters<RequestHandler>[1]) {
  res.clearCookie(SESSION_PRESENCE_COOKIE, {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  });
}
```

### Phase 5: Provider + Router Wiring ✅

**Modify: `apps/web/src/features/auth/_domain/auth-session-provider.tsx`** (+15 lines)

- Add optional `onStateChange?: (state: AuthSessionState) => void` prop
- Add `useEffect` to call `onStateChange(state)` on state changes
- Call `useSessionRestore(actions)` inside provider body

**Modify: `apps/web/src/providers/index.tsx`** (+20 lines)

- `getContext()` 同時建立 auth bridge：
  - `createAuthReadyGate()` → `{ wait, onStateChange }`
  - `authSessionRef` 追蹤最新狀態
  - 回傳 `{ queryClient, getAuthSessionState, waitForAuthReady, onAuthStateChange }`
- `Provider` 接收完整 context，將 `onAuthStateChange` 傳給 `AuthSessionProvider`

```typescript
export function getContext() {
  const queryClient = new QueryClient();
  const authRef: { current: AuthSessionState } = {
    current: { status: 'unknown' },
  };
  const gate = createAuthReadyGate();

  const onAuthStateChange = (state: AuthSessionState) => {
    authRef.current = state;
    gate.onStateChange(state.status);
  };

  return {
    queryClient,
    getAuthSessionState: () => authRef.current,
    waitForAuthReady: gate.wait,
    onAuthStateChange,
  };
}

export function Provider({
  children,
  context,
}: {
  children: React.ReactNode;
  context: ReturnType<typeof getContext>;
}) {
  return (
    <QueryClientProvider client={context.queryClient}>
      <AuthSessionProvider onStateChange={context.onAuthStateChange}>
        {children}
      </AuthSessionProvider>
    </QueryClientProvider>
  );
}
```

**Modify: `apps/web/src/routes/__root.tsx`** (+5 lines)

- Expand `MyRouterContext` type:
  ```typescript
  getAuthSessionState: () => AuthSessionState;
  waitForAuthReady: () => Promise<void>;
  ```

**Modify: `apps/web/src/router.tsx`** (+10 lines)

- `Wrap` 改為使用 `Provider` 元件：
  ```typescript
  const rqContext = AppProviders.getContext();
  const router = createRouter({
    routeTree,
    context: { ...rqContext },
    Wrap: ({ children }) => (
      <AppProviders.Provider context={rqContext}>
        {children}
      </AppProviders.Provider>
    ),
  });
  ```
- 移除對 `AuthSessionProvider` 的直接 import

### Phase 6: Route Guard（SSR + Client）

**New: `apps/web/src/features/auth/_domain/check-session-presence.ts`** (~10 lines)

- `createServerFn` 包裝 `getCookie('session_presence')` 讀取

```typescript
import { createServerFn } from '@tanstack/react-start';
import { getCookie } from '@tanstack/react-start/server';

export const checkSessionPresence = createServerFn({ method: 'GET' }).handler(
  async () => !!getCookie('session_presence'),
);
```

**Modify: `apps/web/src/routes/dashboard.tsx`** (+25 lines)

- Add `beforeLoad` hook with SSR + Client guard：

```typescript
beforeLoad: async ({ context, location }) => {
  // --- Server: 檢查 session_presence cookie (fail-closed) ---
  if (typeof window === 'undefined') {
    let hasPresence = false;
    try {
      hasPresence = await checkSessionPresence();
    } catch {
      // getCookie 失敗 → fail-closed
    }
    if (!hasPresence) {
      throw redirect({
        to: '/auth/login',
        search: { redirect: location.href },
      });
    }
    return;
  }

  // --- Client: 完整 auth state 驗證 ---
  if (context.getAuthSessionState().status === 'unknown') {
    await context.waitForAuthReady();
  }

  if (context.getAuthSessionState().status !== 'authenticated') {
    throw redirect({
      to: '/auth/login',
      search: { redirect: location.href }, // 保留完整 path+search+hash
    });
  }
};
```

**注意 redirect target**：使用 `location.href`（完整 path+search+hash），與 `frontend-layout.tsx:18` 的做法一致，不會丟失 query/hash。

### Phase 7: Header & Sidebar UI

**Modify: `apps/web/src/components/app-header.tsx`** (+35 lines)

- Expand props: add `user?: AuthUser`, `onLogout?: () => void`, `authStatus: AuthSessionState['status']`
- When `authenticated`: show user name + `DropdownMenu` (shadcn) with "Dashboard" link and "Logout" button
- When `unknown`: show disabled placeholder (no flash)
- When `anonymous`: show "Login" button (existing)

**Modify: `apps/web/src/components/frontend-layout.tsx`** (+8 lines)

- Extract `user` from authenticated state
- Use `useLogout()` hook
- Pass `user`, `onLogout`, `authStatus` to `AppHeader`

**Modify: `apps/web/src/components/dashboard-sidebar.tsx`** (+8 lines)

- Add props: `userName?: string`, `onLogout?: () => void`
- When authenticated: show user name + "登出" button calling `onLogout`
- When not authenticated: keep "登入" button (existing)

**Modify: `apps/web/src/components/dashboard-layout.tsx`** (+8 lines)

- Use `useLogout()` hook
- Extract `user.name` from authenticated state
- Pass `userName` and `onLogout` to `DashboardSidebar`

### Phase 8: Test Coverage

**New: `apps/web/src/routes/dashboard.test.ts`** (~50 lines)

- Server: 無 `session_presence` cookie → redirect to login
- Server: 有 cookie → 不 redirect
- Client: unknown → waits, then authenticated → 不 redirect
- Client: unknown → waits, then anonymous → redirect to login
- Client: redirect 保留完整 path+search+hash

**Modify: `apps/web/src/providers/index.test.tsx`** (+20 lines)

- 測試 `getContext()` 回傳的 bridge：
  - `getAuthSessionState()` 初始為 unknown
  - `onAuthStateChange(authenticated)` 後 ref 更新
  - `waitForAuthReady` 在 authenticated 後 resolve
  - 狀態回到 unknown 時 gate 重置

**Modify: `apps/web/src/features/auth/_domain/auth-session-provider.test.tsx`** (+15 lines)

- 測試 `onStateChange` callback 在狀態變更時被呼叫

### Phase Final: Update Relative Docs

---

## Line Count Estimate

| File                             | Change | Est. Lines     |
| -------------------------------- | ------ | -------------- |
| `auth-ready-gate.ts`            | New    | +20            |
| `auth-ready-gate.test.ts`       | New    | +40            |
| `use-session-restore.ts`        | New    | +35            |
| `use-session-restore.test.ts`   | New    | +80            |
| `use-logout.ts`                 | New    | +25            |
| `use-logout.test.ts`            | New    | +50            |
| `check-session-presence.ts`     | New    | +10            |
| `dashboard.test.ts`             | New    | +50            |
| `auth.controller.ts` (API)      | Mod    | +15            |
| `auth-session-provider.tsx`     | Mod    | +15            |
| `auth-session-provider.test.tsx`| Mod    | +15            |
| `__root.tsx`                    | Mod    | +5             |
| `router.tsx`                    | Mod    | +10            |
| `providers/index.tsx`           | Mod    | +20            |
| `providers/index.test.tsx`      | Mod    | +20            |
| `dashboard.tsx` (route)         | Mod    | +25            |
| `app-header.tsx`                | Mod    | +35            |
| `frontend-layout.tsx`           | Mod    | +8             |
| `dashboard-layout.tsx`          | Mod    | +8             |
| `dashboard-sidebar.tsx`         | Mod    | +8             |
| **Total**                       |        | **~495 lines** |

逼近 500 行上限但可控。核心測試（route guard、provider bridge、auth-ready-gate）必須留在 PR-3。

---

## Review Issues 回應

| #   | Severity | Issue                                      | Resolution |
| --- | -------- | ------------------------------------------ | ---------- |
| 1   | HIGH     | Provider 職責分裂，違反 spec §4.2 集中原則 | Bridge 建立在 `getContext()`，`Wrap` 使用 `Provider` 元件，`providers/index.tsx` 保持為唯一 provider 管理處 |
| 2   | HIGH     | SSR guard bypass 有授權邊界風險            | 新增 `session_presence` cookie（`Path=/`）做 SSR hint；server `beforeLoad` 用 `getCookie()` 檢查，fail-closed |
| 3   | MEDIUM   | 測試覆蓋不足                               | 新增 route guard tests、provider bridge tests、onStateChange callback test；核心測試必留 PR-3 |
| 4   | MEDIUM   | Redirect target 退化（丟失 query/hash）    | Guard 使用 `location.href` 保留完整 path+search+hash |
| 5   | MEDIUM   | waitForAuthReady 一次性 promise            | 改為 resettable gate：unknown 時重建 promise |

### 額外修正（第二輪 review）

| #   | Severity | Issue                                              | Resolution |
| --- | -------- | -------------------------------------------------- | ---------- |
| R1  | CRITICAL | `refresh_token` 的 `path=/api/auth` 導致 SSR 讀不到 | 改用 `session_presence` cookie（`Path=/`）做 hint |
| R2  | HIGH     | `vinxi/http` 不可用                               | 改用 `@tanstack/react-start/server` 的 `getCookie()`，用 `createServerFn` 包裝避免 client bundle 汙染 |
| R3  | MEDIUM   | fail-open 弱化安全邊界                              | 改為 fail-closed：`getCookie` 失敗也 redirect |
| R4  | MEDIUM   | `cookies.includes()` 字串比對脆弱                  | 改用 `getCookie('session_presence')` 精確比對 |
| R5  | MEDIUM   | 測試拆到 PR-4 與 TDD 目標衝突                      | 核心測試（route guard、provider bridge、auth-ready-gate）必留 PR-3 |

---

## Edge Cases & Mitigations

| Risk | Mitigation |
|------|------------|
| `beforeLoad` fires before provider mounts | `waitForAuthReady()` blocks until state resolves; ref starts as `unknown` |
| SSR 無法讀取 `refresh_token`（path=/api/auth） | 使用 `session_presence` cookie（Path=/）做 SSR hint |
| Server revoke 後 `session_presence` 仍在 | Client guard 補擋；`session_presence` 是優化層非安全邊界 |
| `getCookie()` / `createServerFn` 執行失敗 | Fail-closed：redirect to login |
| `logout()` API fails | Best-effort: still clear local state and navigate |
| React StrictMode double-mount | Ref guard in `useSessionRestore` prevents duplicate API calls |
| `unknown` state flash | Header renders placeholder; `beforeLoad` awaits resolution |
| Gate 需可重置 | `createAuthReadyGate` 在 unknown 時重建 promise |
| `Provider` API 變更影響既有測試 | 更新 `providers/index.test.tsx` 使用新的 context-based API |

---

## Verification

1. **Unit tests**: `pnpm --filter web test` + `pnpm --filter api test` -- all new/updated tests pass
2. **Manual flows**:
   - Visit `/dashboard` while logged out → SSR 即 redirect to `/auth/login?redirect=...`
   - Visit `/dashboard?tab=settings#profile` → redirect 保留完整 query+hash
   - Login → redirected back to `/dashboard`
   - Refresh page on `/dashboard` → session restores, stays on dashboard
   - Clear cookies → refresh → SSR redirect to login
   - Click logout (header dropdown) → navigates to `/`, `/dashboard` is guarded
   - Click logout (sidebar) → same behavior
3. **Build check**: `pnpm build` passes
4. **Type check**: `pnpm check-types` passes

---

## Files to Modify (Quick Reference)

**Backend (apps/api):**

- `apps/api/src/modules/auth/auth.controller.ts`

**Frontend - New Files (apps/web):**

- `apps/web/src/features/auth/_domain/auth-ready-gate.ts`
- `apps/web/src/features/auth/_domain/auth-ready-gate.test.ts`
- `apps/web/src/features/auth/_domain/use-session-restore.ts`
- `apps/web/src/features/auth/_domain/use-session-restore.test.ts`
- `apps/web/src/features/auth/_domain/use-logout.ts`
- `apps/web/src/features/auth/_domain/use-logout.test.ts`
- `apps/web/src/features/auth/_domain/check-session-presence.ts`
- `apps/web/src/routes/dashboard.test.ts`

**Frontend - Modified Files (apps/web):**

- `apps/web/src/features/auth/_domain/auth-session-provider.tsx`
- `apps/web/src/features/auth/_domain/auth-session-provider.test.tsx`
- `apps/web/src/routes/__root.tsx`
- `apps/web/src/router.tsx`
- `apps/web/src/providers/index.tsx`
- `apps/web/src/providers/index.test.tsx`
- `apps/web/src/routes/dashboard.tsx`
- `apps/web/src/components/app-header.tsx`
- `apps/web/src/components/frontend-layout.tsx`
- `apps/web/src/components/dashboard-layout.tsx`
- `apps/web/src/components/dashboard-sidebar.tsx`

## Reusable Existing Code

- `refresh()`, `me()`, `logout()` from `auth-client.ts`
- `useAuthSessionState()`, `useAuthSessionActions()` from `auth-session-provider.tsx`
- `sanitizeRedirectTarget()` from `redirect-target.ts`
- `AuthApiError` for error discrimination in tests
- `createServerFn` pattern from `data/demo.punk-songs.ts`
- `getCookie()` from `@tanstack/react-start/server`
- shadcn `DropdownMenu` for header user menu
- shadcn `Button` already used throughout
