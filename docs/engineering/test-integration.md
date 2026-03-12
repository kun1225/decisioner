# Integration Test Conventions

API integration tests live in `apps/api/src/modules/<name>/<name>.integration.test.ts`.

Reference implementations:

- `apps/api/src/modules/auth/auth.integration.test.ts`
- `apps/api/src/modules/templates/template.integration.test.ts`

## Shared Utilities

All shared helpers live in `apps/api/src/test-utils/test-agent.ts`:

| Export             | Purpose                                                    |
| ------------------ | ---------------------------------------------------------- |
| `createTestAgent`  | Creates a supertest agent bound to the Express app         |
| `withAuth`         | Wraps an agent so every request includes a Bearer token    |
| `extractCookie`    | Extracts a named cookie value from a response              |
| `parseCookieFlags` | Parses cookie flags (HttpOnly, SameSite, Path) for a name |
| `TestAgent`        | Type alias for `supertest.agent` return type               |

## File Structure

```ts
// 1. Imports
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { closeTestDb, setupTestDb, truncateTables } from '@repo/database/test-utils/setup-test-db';
import { createTestAgent, type TestAgent, withAuth } from '@/test-utils/test-agent.js';

// 2. Constants
const VALID_REGISTER = { /* ... */ };

// 3. DB lifecycle (file-level, identical in every integration test)
beforeAll(async () => { await setupTestDb(); }, 30_000);
afterEach(async () => { await truncateTables(); });
afterAll(async () => { await closeTestDb(); });

// 4. Describe blocks with per-block beforeEach
describe('feature integration', () => {
  let agent: TestAgent;
  let accessToken: string;

  beforeEach(async () => {
    agent = createTestAgent();
    const res = await agent.post('/api/auth/register').send(VALID_REGISTER);
    accessToken = res.body.accessToken as string;
  });

  it('does something', async () => {
    const res = await withAuth(agent, accessToken).post('/api/...').send({ ... });
    expect(res.status).toBe(201);
  });
});
```

## Rules

### Inline HTTP calls — no assertion-hiding helpers

Every HTTP call and its status assertion must be visible inside the test body. Do not extract helpers that call `expect()` internally.

```ts
// Good: assertion visible at the call site
const res = await withAuth(agent, accessToken).post('/api/templates').send({ name: 'Push Day' });
expect(res.status).toBe(201);

// Bad: assertion hidden inside a helper
const template = await createTemplate(agent, accessToken, 'Push Day');
// Where does it assert 201? You have to jump to the helper to know.
```

### Use `beforeEach` for auth setup — no manual indices

Each `describe` block declares `let agent` + `let accessToken` and registers a user in `beforeEach`. Since `afterEach` calls `truncateTables()`, every test starts with a clean DB. Do not use index-based email uniqueness (`registerAndAuthenticate(3)`).

### Keep `withAuth` for Bearer-authenticated calls

Use `withAuth(agent, accessToken)` for any endpoint that requires a Bearer token. For endpoints that test various auth states (no token, invalid token, cookie-based), call `.set()` inline instead.

### Multi-user tests register the extra user inline

When a test needs a second user (e.g. authorization boundary tests), register them directly in the test body with a comment explaining the setup:

```ts
it('returns 403 when another user tries to mutate', async () => {
  // Register a second user (owner is from beforeEach)
  const strangerAgent = createTestAgent();
  const strangerRes = await strangerAgent.post('/api/auth/register').send({
    ...VALID_REGISTER,
    email: 'stranger@example.com',
    name: 'Stranger',
  });
  const strangerToken = strangerRes.body.accessToken as string;
  // ... rest of test
});
```

### One describe block per logical concern

Split tests into separate `describe` blocks by domain area (e.g. `template CRUD integration`, `template ordering integration`). Each block has its own `beforeEach` for self-containment. If the file exceeds ~500 lines, split into separate files.

### DB lifecycle hooks are always file-level

`beforeAll(setupTestDb)`, `afterEach(truncateTables)`, `afterAll(closeTestDb)` are declared at file scope, never inside `describe` blocks.
