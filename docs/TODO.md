# Phase 1 (Core) Implementation TODO

> Auto-generated from implementation plan. Updated: 2026-02-15

---

## Phase A: Auth API

- [x] A.1: API Middleware
  - [x] `apps/api/src/middleware/error-handler.ts`
  - [x] `apps/api/src/middleware/require-auth.ts`
  - [x] `apps/api/src/types/express.d.ts`
- [x] A.2: Auth Module
  - [x] `apps/api/src/modules/auth/auth.service.ts`
  - [x] `apps/api/src/modules/auth/auth.service.test.ts` (11 tests)
  - [x] `apps/api/src/modules/auth/auth.controller.ts`
  - [x] `apps/api/src/modules/auth/auth.routes.ts`
- [x] A.3: Wire up `app.ts` (dotenv, cookie-parser, routes, error handler)
- [x] A.4: Verify auth flow (register, login, me, refresh, logout)

---

## Phase B: Fitness Core DB Schema

- [x] B.1: Enums (`packages/database/src/schema/enums.ts`)
  - [x] `exerciseSource`: PRESET | CUSTOM
  - [x] `sessionStatus`: IN_PROGRESS | COMPLETED
  - [x] `sessionItemOrigin`: TEMPLATE | REPLACED | MANUAL
  - [x] `weightUnit`: KG | LB
  - [x] Move `authProvider` from user.ts to enums.ts
- [x] B.2: Gyms (`gym.ts`)
  - [x] `gyms` table
- [x] B.3: Exercises (`exercise.ts`)
  - [x] `exercises` table (with soft delete)
- [x] B.4: Templates (`template.ts`)
  - [x] `templates` table
  - [x] `templateItems` table
  - [x] `templateVersions` table
  - [x] `templateVersionItems` table
- [x] B.5: Workouts (`workout.ts`)
  - [x] `workoutSessions` table
  - [x] `workoutSessionItems` table
  - [x] `workoutSets` table
  - [x] `workoutSessionRevisions` table
- [x] B.6: Metrics (`metric.ts`)
  - [x] `exerciseSessionMetrics` table
- [x] B.7: Indexes (per spec 3.4)
- [x] B.8: `pnpm db:generate` + `pnpm db:migrate`

---

## Phase C: Shared Validation Schemas

- [ ] `packages/shared/src/schemas/exercise.ts`
- [ ] `packages/shared/src/schemas/gym.ts`
- [ ] `packages/shared/src/schemas/template.ts`
- [ ] `packages/shared/src/schemas/workout.ts`
- [ ] `packages/shared/src/schemas/progress.ts`

---

## Phase D: API Modules — Exercises & Gyms

- [ ] D.1: Exercises Module (`apps/api/src/modules/exercises/`)
  - [ ] `exercises.service.ts`
  - [ ] `exercises.controller.ts`
  - [ ] `exercises.routes.ts`
  - [ ] Endpoints: GET /preset, POST /custom, GET /:exerciseId
- [ ] D.2: Gyms Module (`apps/api/src/modules/gyms/`)
  - [ ] `gyms.service.ts`
  - [ ] `gyms.controller.ts`
  - [ ] `gyms.routes.ts`
  - [ ] Endpoints: POST /, GET /
- [ ] D.3: Unit tests
  - [ ] `exercises.service.test.ts`
  - [ ] `gyms.service.test.ts`

---

## Phase D+: Integration Test Infrastructure

> 在第一組 API module 完成後建立，後續 Phase 共用。

- [ ] D+.1: Test infrastructure
  - [ ] Test DB setup (separate `joygym_test` database)
  - [ ] Migration runner for test DB
  - [ ] `createTestApp()` helper (in-process supertest)
  - [ ] DB cleanup between tests (truncate all tables)
  - [ ] Auth helper (`registerAndLogin()` → returns accessToken + cookie)
- [ ] D+.2: Auth integration tests
  - [ ] Register → login → me → refresh → logout → refresh fails
  - [ ] Duplicate email → 409
  - [ ] Refresh token reuse detection → family revoked
- [ ] D+.3: Exercises & Gyms integration tests
  - [ ] Create gym → list gyms
  - [ ] Create custom exercise → get by id
  - [ ] List preset exercises

---

## Phase E: API Module — Templates

- [ ] `apps/api/src/modules/templates/`
  - [ ] `templates.service.ts` (CRUD + versioning)
  - [ ] `templates.controller.ts`
  - [ ] `templates.routes.ts`
  - [ ] 9 endpoints (CRUD + items + versions + share)
- [ ] E.T: Unit + integration tests
  - [ ] `templates.service.test.ts`
  - [ ] Integration: CRUD + items + versioning flow

---

## Phase F: API Module — Workouts

- [ ] `apps/api/src/modules/workouts/`
  - [ ] `workouts.service.ts` (start, sets, finish, history, past edit)
  - [ ] `workouts.controller.ts`
  - [ ] `workouts.routes.ts`
  - [ ] 10 endpoints
- [ ] F.T: Unit + integration tests
  - [ ] `workouts.service.test.ts`
  - [ ] Integration: full workout flow (spec 11)
    - [ ] Start session from template → verify snapshot isolation
    - [ ] Replace exercise mid-session (origin_type = REPLACED)
    - [ ] Add sets → finish session → verify metrics computed
  - [ ] Integration: history & past edit
    - [ ] List history → verify session appears
    - [ ] Edit completed session → verify revision created
    - [ ] Verify metrics recomputed after edit

---

## Phase G: API Module — Progress

- [ ] `apps/api/src/modules/progress/`
  - [ ] `progress.service.ts` (last/best, max-weight, volume)
  - [ ] `progress.controller.ts`
  - [ ] `progress.routes.ts`
  - [ ] 3 endpoints
- [ ] G.T: Unit + integration tests
  - [ ] `progress.service.test.ts`
  - [ ] Integration: last/best returns correct data after workout
  - [ ] Integration: chart data correct after multiple sessions

---

## Phase G.5: API Module — Social Lite (MVP Free)

- [ ] `apps/api/src/modules/social/`
  - [ ] `social.service.ts`
  - [ ] `social.controller.ts`
  - [ ] `social.routes.ts`
  - [ ] Endpoints: friends invite/accept/latest-workout + crews create/list/add-member
  - [ ] Free-Lite guard: max 1 crew per owner
  - [ ] Free-Lite guard: max 2 members per crew
  - [ ] Over-limit error contract: `422 FREE_TIER_LIMIT_EXCEEDED`

---

## Phase H: Frontend Infrastructure

- [ ] H.1: API client setup
  - [ ] Axios/fetch wrapper with access token interceptor
  - [ ] Refresh token auto-retry (401 → refresh → retry)
  - [ ] Base URL config (`API_URL` env var)
- [ ] H.2: Auth state management
  - [ ] Auth context/store (accessToken, user, isAuthenticated)
  - [ ] Token persistence (memory only, refresh via cookie)
- [ ] H.3: Route guards
  - [ ] `__root.tsx` — auth bootstrap (call `/api/auth/me` on app load)
  - [ ] Protected route wrapper (redirect to `/login` if not authenticated)
- [ ] H.4: CORS on API
  - [ ] Enable CORS for `apps/web` origin in `apps/api`

---

## Phase H+: Playwright E2E Infrastructure

- [ ] H+.1: Playwright setup + config
- [ ] H+.2: Test DB seed script (preset exercises, test user)
- [ ] H+.3: API server + web dev server startup in `globalSetup`
- [ ] H+.4: Auth fixture (`authenticatedPage` — pre-logged-in browser context)

---

## Phase I: Frontend — Auth Pages

- [ ] I.1: `/login` — email/password form, call `POST /api/auth/login`
- [ ] I.2: `/register` — registration form with password confirmation
- [ ] I.3: Redirect to `/` after successful auth
- [ ] I.4: Logout button in app shell, call `POST /api/auth/logout`
- [ ] I.E2E: Auth journey (Playwright)
  - [ ] Register → redirect to dashboard
  - [ ] Login → redirect to dashboard
  - [ ] Visit protected page without auth → redirect to login
  - [ ] Logout → redirect to login

---

## Phase J: Frontend — Template Management

- [ ] J.1: `/templates` — list own templates (GET /api/templates)
- [ ] J.2: `/templates/new` — create template form
- [ ] J.3: `/templates/$templateId` — edit template (add/remove/reorder items)
- [ ] J.4: `/templates/$templateId/versions` — version history timeline
- [ ] J.E2E: Template journey (Playwright)
  - [ ] Create template → add exercises → save → appears in list
  - [ ] Edit template → verify version history updated

---

## Phase K: Frontend — Training Session

- [ ] K.1: `/train/start` — select gym + template, start session
- [ ] K.2: `/train/$sessionId` — training editor
  - [ ] Set logging (weight, reps, unit per set)
  - [ ] Add/replace/remove exercises mid-session
  - [ ] Last/best display per exercise (GET /api/progress/.../last-best)
  - [ ] Finish session button
- [ ] K.3: Completed session edit mode (same route, different UX)
  - [ ] Revision warning prompt
  - [ ] Save triggers revision + metrics recompute
- [ ] K.E2E: Training journey (Playwright)
  - [ ] Start session → log sets → finish → appears in history
  - [ ] Replace exercise mid-session → verify UI updates
  - [ ] Last/best display shows correct data during training

---

## Phase L: Frontend — History & Progress

- [ ] L.1: `/workouts/history` — past workout list (date + template)
  - [ ] Cursor pagination
  - [ ] Click to navigate to `/train/$sessionId`
- [ ] L.2: `/progress` — exercise progress charts
  - [ ] Max weight trend chart (x: date, y: weight)
  - [ ] Volume trend chart (x: date, y: volume)
  - [ ] Exercise selector
- [ ] L.E2E: History & progress journey (Playwright)
  - [ ] View history list → click into past session
  - [ ] Edit past session → confirm revision warning → save
  - [ ] Progress charts render with data

---

## Phase L.5: Frontend — Social Lite (MVP Free)

- [ ] `/friends` — invite/accept/list basic friend activity
- [ ] `/crews` — create/list/add-member
  - [ ] 顯示免費限制提示（每人最多 1 群、每群最多 2 人）
  - [ ] 超限時顯示 API 錯誤文案（`FREE_TIER_LIMIT_EXCEEDED`）
- [ ] L.5.E2E: Social Lite journey (Playwright)
  - [ ] Create first crew succeeds
  - [ ] Create second crew blocked by free limit
  - [ ] Add second member succeeds, third member blocked by free limit

---

## Deferred (not in Phase 1)

- [ ] Google OAuth (`POST /api/auth/google`)
- [ ] Media/S3 upload (custom exercise images)
- [ ] Pro analytics: e1RM chart, weekly muscle volume, weekly adherence
- [ ] Pro logging: RPE/RIR set logging + analytics
- [ ] Pro goals module: weekly target + adherence mode
- [ ] Achievements — PRD Phase 3
- [ ] Rate limiting
- [ ] Dashboard (`/` — quick actions, recent workouts)
