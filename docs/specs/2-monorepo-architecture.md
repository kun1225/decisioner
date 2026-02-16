# 2. Monorepo Architecture

## 2.1 Top-level Structure

```text
joygym/
├── apps/
│   ├── web/
│   └── api/
├── packages/
│   ├── database/
│   ├── shared/
│   ├── auth/
│   ├── ui/
│   ├── eslint-config/
│   └── typescript-config/
└── docs/
```

## 2.2 Responsibilities

1. `apps/web`: UI routes, view logic, query/mutation wiring
2. `apps/api`: REST API, auth, business rules, data access
3. `packages/database`: schema, relations, migrations, db client
4. `packages/shared`: zod schemas, shared DTO/types
5. `packages/auth`: token/password utilities
6. `packages/ui`: shared UI components

## 2.3 Dependency Rules

1. `apps/*` can depend on `packages/*`
2. `packages/*` cannot depend on `apps/*`
3. No circular dependency between packages
4. `packages/database` cannot include HTTP/UI logic

## 2.4 Workspace Commands (Reference)

1. `pnpm dev`
2. `pnpm build`
3. `pnpm lint`
4. `pnpm check-types`
5. `pnpm test`
