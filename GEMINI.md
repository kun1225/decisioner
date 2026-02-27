# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

JoyGym (揪Gym) is a weight training tracking app with social features. It's a pnpm monorepo managed by Turborepo.

## Common Commands

```bash
# Development
pnpm dev                    # Start all apps (API + Web)
pnpm build                  # Build everything
pnpm lint                   # Lint all packages
pnpm lint:fix               # Auto-fix lint issues
pnpm format                 # Prettier format
pnpm check-types            # TypeScript check all packages
pnpm test                   # Run all tests

# Database (requires Docker running)
docker compose up -d        # Start PostgreSQL
pnpm db:generate            # Generate Drizzle migrations
pnpm db:migrate             # Apply migrations
pnpm db:studio              # Open Drizzle Studio

# Single package commands
pnpm --filter api test      # Run API tests only
pnpm --filter web test      # Run web tests only
pnpm --filter api dev       # Run API only
pnpm --filter web dev       # Run web only (port 3000)

# Single test file
cd apps/api && npx vitest run src/modules/auth/auth.service.test.ts
cd apps/web && npx vitest run src/path/to/test.ts
```

## Environment Setup

Copy `apps/api/.env.example` to `apps/api/.env`. The database package reads its `DATABASE_URL` from `apps/api/.env`.

## Architecture

### Monorepo Layout

- **`apps/web`** — TanStack Start (React 19 + Vite + TanStack Router/Query). SSR-capable via Nitro.
- **`apps/api`** — Express 5 REST API. JWT auth with access token (Bearer) + refresh token (HttpOnly cookie).
- **`packages/database`** — Drizzle ORM schema, migrations, db client. PostgreSQL 17.
- **`packages/shared`** — Zod schemas and shared types used by both apps.
- **`packages/auth`** — JWT and bcrypt utilities.
- **`packages/ui`** — Shared React components.
- **`packages/eslint-config`** / **`packages/typescript-config`** — Shared configs.

Dependency rule: `apps/*` depends on `packages/*`, never the reverse. No circular deps between packages.

### Backend Pattern

```
Route -> Controller -> Service -> Repository(DB)
```

- Controllers: transport mapping + Zod validation only
- Services: business rules, privacy guards
- Modules live in `apps/api/src/modules/<name>/` with `*.routes.ts`, `*.controller.ts`, `*.service.ts`, `*.service.test.ts`
- Path alias `@/` maps to `apps/api/src/`
- All write APIs require auth. API base path: `/api`

### Frontend Pattern

Page-oriented structure under `src/routes/` (file-based routing via TanStack Router):

- `/_components/` — private page components
- `/_domain/` — private page logic (services, validation)
- `src/features/` — cross-page shared features only
- `src/lib/` — utilities
- `src/providers/index.tsx` — single Provider export wrapping all providers
- `src/components/ui/` — shadcn components

Data fetching: TanStack Query for server state, route loaders for prefetch, mutations invalidate query keys.

## Documentation Structure

- `docs/PRD.md` — PRD entry point
- `docs/prd/goals/g-XX.md` — Individual goal files (single source of truth for requirements)
- `docs/specs/` — Technical specs (1-tech-stack, 2-monorepo-architecture, 3-backend-architecture, 4-frontend-architecture, 5-api-design, 6-data-model)
- If a goal file conflicts with a spec, the goal file's Acceptance Criteria is the source of truth

## Code Conventions

- **File naming**: kebab-case for all files (e.g., `auth-service.ts`, `practice-header.tsx`)
- **UI components**: Always prefer shadcn. Only custom-build when shadcn has no match; document rationale in PR.
- **Styling**: Tailwind CSS v4 + CVA + clsx + tailwind-merge
- **Validation**: Zod for all input validation (shared schemas in `packages/shared`)
- **Immutability**: Always create new objects, never mutate

## Security & Configuration Tips

- Never commit secrets; use environment variables.
- Confirm auth, error handling, and sensitive-data safety before merge.
- Enforce authorization at the resource level (not only route-level); validate token issuer, audience, and expiry.
- Validate all external input at trust boundaries; use strict schemas (reject unknown fields) and parameterized queries.
- Apply rate limits, payload size limits, and timeouts to reduce abuse and DoS risk.
- Do not log secrets or sensitive data; use structured logging and safe error responses (no stack traces in prod).
- Separate dev/staging/prod environments; never reuse credentials or production data.

## Delivery Workflow

1. Pick scope from PRD goals:

- Start at `docs/prd/goals-and-scope.md`.
- Select one goal/task (for example `g-18`) and use `docs/prd/goals/g-XX.md` as the implementation source of truth.

2. Create isolated worktree and branch:

- Example: `git worktree add ../joy-gym-g18 -b feat/g-18-auth-session-security`.
- Keep one goal/task per branch to avoid mixed scope.

3. TDD first (mandatory):

- Write tests first and confirm they fail (RED).
- Implement minimal code to pass tests (GREEN).
- Refactor while keeping tests green.

4. Coverage gate:

- Maintain at least 80% coverage for changed/new modules.
- Run relevant tests before PR (for example `pnpm --filter api test`, `pnpm test`).

5. PR size limit:

- Each PR must stay under 500 changed lines (`+/-` total).
- If over 500 lines, split into smaller PRs by sub-task or layer (API, DB, UI).
