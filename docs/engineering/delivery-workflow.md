# Delivery Workflow

## 1. Pick scope from PRD goals

- Start at `docs/prd/goals-and-scope.md`.
- Select one goal/task (for example `g-18`) and use `docs/prd/goals/g-XX.md` as the implementation source of truth.

## 2. Create isolated worktree and branch

- Example: `git worktree add ../joy-gym-g18 -b feat/g-18-auth-session-security`.
- Keep one goal/task per branch to avoid mixed scope.

## 3. TDD first (mandatory)

- Write tests first and confirm they fail (RED).
- Implement minimal code to pass tests (GREEN).
- Refactor while keeping tests green.

## 4. Coverage gate

- Maintain at least 80% coverage for changed/new modules.
- Run relevant tests before PR (for example `pnpm --filter api test`, `pnpm test`).

## 5. PR size limit

- Each PR must stay under 500 changed lines (`+/-` total).
- If over 500 lines, split into smaller PRs by sub-task or layer (API, DB, UI).

## 6. Atomic commits (mandatory)

- Each commit has exactly one responsibility. Never mix unrelated changes in a single commit.
- Commit types: `feat`, `fix`, `refactor`, `test`, `chore`, `docs`, `perf`, `ci`.
- Ordering: infrastructure/dependency changes first, then bug fixes, then feature code, then tests.
- Every commit should leave the codebase in a buildable, consistent state.
- Never commit generated files (lockfile changes are the exception) together with logic changes — separate them if the lockfile diff is large.
- Examples of good atomic splits:
  - `chore: add supertest devDependency` (deps only)
  - `fix: convert JWT errors to ApiError in rotateRefreshToken` (one bug, one fix)
  - `test: auth integration tests for register and login` (tests only)
