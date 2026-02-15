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

- [ ] B.1: Enums (`packages/database/src/schema/enums.ts`)
  - [ ] `exerciseSource`: PRESET | CUSTOM
  - [ ] `sessionStatus`: IN_PROGRESS | COMPLETED
  - [ ] `sessionItemOrigin`: TEMPLATE | REPLACED | MANUAL
  - [ ] `weightUnit`: KG | LB
  - [ ] Move `authProvider` from user.ts to enums.ts
- [ ] B.2: Gyms & Equipment (`gym.ts`)
  - [ ] `gyms` table
  - [ ] `gymEquipments` table
- [ ] B.3: Exercises (`exercise.ts`)
  - [ ] `exercises` table (with soft delete)
- [ ] B.4: Templates (`template.ts`)
  - [ ] `templates` table
  - [ ] `templateItems` table
  - [ ] `templateVersions` table
  - [ ] `templateVersionItems` table
- [ ] B.5: Workouts (`workout.ts`)
  - [ ] `workoutSessions` table
  - [ ] `workoutSessionItems` table
  - [ ] `workoutSets` table
  - [ ] `workoutSessionRevisions` table
- [ ] B.6: Metrics (`metric.ts`)
  - [ ] `exerciseSessionMetrics` table
- [ ] B.7: Indexes (per spec 3.4)
- [ ] B.8: `pnpm db:generate` + `pnpm db:migrate`

---

## Phase C: Shared Validation Schemas

- [ ] `packages/shared/src/schemas/exercise.ts`
- [ ] `packages/shared/src/schemas/gym.ts`
- [ ] `packages/shared/src/schemas/template.ts`
- [ ] `packages/shared/src/schemas/workout.ts`

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
  - [ ] Endpoints: POST /, POST /:gymId/equipments, GET /:gymId/equipments

---

## Phase E: API Module — Templates

- [ ] `apps/api/src/modules/templates/`
  - [ ] `templates.service.ts` (CRUD + versioning)
  - [ ] `templates.controller.ts`
  - [ ] `templates.routes.ts`
  - [ ] 9 endpoints (CRUD + items + versions, no share in Phase 1)

---

## Phase F: API Module — Workouts

- [ ] `apps/api/src/modules/workouts/`
  - [ ] `workouts.service.ts` (start, sets, finish, history, past edit)
  - [ ] `workouts.controller.ts`
  - [ ] `workouts.routes.ts`
  - [ ] 10 endpoints

---

## Phase G: API Module — Progress

- [ ] `apps/api/src/modules/progress/`
  - [ ] `progress.service.ts` (last/best, max-weight chart, volume chart)
  - [ ] `progress.controller.ts`
  - [ ] `progress.routes.ts`
  - [ ] 3 endpoints

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

## Phase I: Frontend — Auth Pages

- [ ] I.1: `/login` — email/password form, call `POST /api/auth/login`
- [ ] I.2: `/register` — registration form with password confirmation
- [ ] I.3: Redirect to `/` after successful auth
- [ ] I.4: Logout button in app shell, call `POST /api/auth/logout`

---

## Phase J: Frontend — Template Management

- [ ] J.1: `/templates` — list own templates (GET /api/templates)
- [ ] J.2: `/templates/new` — create template form
- [ ] J.3: `/templates/$templateId` — edit template (add/remove/reorder items)
- [ ] J.4: `/templates/$templateId/versions` — version history timeline

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

---

## Phase L: Frontend — History & Progress

- [ ] L.1: `/workouts/history` — past workout list (date + template)
  - [ ] Cursor pagination
  - [ ] Click to navigate to `/train/$sessionId`
- [ ] L.2: `/progress` — exercise progress charts
  - [ ] Max weight trend chart (x: date, y: weight)
  - [ ] Volume trend chart (x: date, y: volume)
  - [ ] Exercise selector

---

## Deferred (not in Phase 1)

- [ ] Google OAuth (`POST /api/auth/google`)
- [ ] Media/S3 upload (custom exercise images)
- [ ] Social (friends, crews, template share) — PRD Phase 2
- [ ] Achievements — PRD Phase 3
- [ ] Rate limiting
- [ ] Dashboard (`/` — quick actions, recent workouts)
