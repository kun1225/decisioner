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

- `/-components/` — private page components
- `/-domain/` — private page logic (services, validation)
- `src/features/` — cross-page shared features only
- `src/lib/` — utilities
- `src/providers/index.tsx` — single Provider export wrapping all providers
- `src/components/ui/` — shadcn components

Data fetching: TanStack Query for server state, route loaders for prefetch, mutations invalidate query keys.

## Documentation Structure

| Path                                    | Description                                              |
| --------------------------------------- | -------------------------------------------------------- |
| `docs/PRD.md`                           | PRD entry point                                          |
| `docs/prd/goals-and-scope.md`           | Goals overview and scope                                 |
| `docs/prd/goals/g-XX.md`                | Individual goal files (source of truth for requirements) |
| `docs/specs/1-tech-stack.md`            | Tech stack decisions                                     |
| `docs/specs/2-monorepo-architecture.md` | Monorepo layout and dependency rules                     |
| `docs/specs/3-backend-architecture.md`  | Backend patterns (Route/Controller/Service/Repository)   |
| `docs/specs/4-frontend-architecture.md` | Frontend patterns (TanStack Router/Query)                |
| `docs/specs/5-api-design.md`            | REST API design conventions                              |
| `docs/specs/6-data-model.md`            | Database schema and data model                           |
| `docs/engineering/code-conventions.md`  | File naming, UI components, styling, validation rules    |
| `docs/engineering/security.md`          | Security checklist and configuration guidelines          |
| `docs/engineering/delivery-workflow.md` | TDD, branching, commits, PR size limits                  |
| `docs/engineering/test-integration.md`  | Integration test conventions and shared utilities        |

If a goal file conflicts with a spec, the goal file's Acceptance Criteria is the source of truth.
