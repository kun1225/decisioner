# 2. Monorepo Structure

```
decisioner/
├── apps/
│   ├── web/                          # TanStack Start frontend
│   │   ├── app/
│   │   │   ├── routes/               # File-based routing
│   │   │   │   ├── __root.tsx        # Root layout
│   │   │   │   ├── index.tsx         # Landing/Dashboard
│   │   │   │   ├── login.tsx
│   │   │   │   ├── register.tsx
│   │   │   │   ├── decisions/
│   │   │   │   │   ├── index.tsx     # Decision list
│   │   │   │   │   ├── new.tsx       # Create decision
│   │   │   │   │   └── $id/
│   │   │   │   │       ├── index.tsx # View/Edit decision
│   │   │   │   │       ├── history.tsx
│   │   │   │   │       └── review.tsx
│   │   │   │   └── patterns.tsx      # Cross-decision view
│   │   │   ├── components/           # App-level components
│   │   │   ├── lib/                  # App utilities
│   │   │   └── styles/
│   │   ├── app.config.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── api/                          # Express.js backend
│       ├── src/
│       │   ├── index.ts              # Server entry
│       │   ├── app.ts                # Express app setup
│       │   ├── routes/
│       │   │   ├── index.ts          # Route aggregator
│       │   │   ├── auth.routes.ts
│       │   │   ├── decision.routes.ts
│       │   │   ├── hypothesis.routes.ts
│       │   │   ├── evidence.routes.ts
│       │   │   └── review.routes.ts
│       │   ├── controllers/
│       │   │   ├── auth.controller.ts
│       │   │   ├── decision.controller.ts
│       │   │   ├── hypothesis.controller.ts
│       │   │   ├── evidence.controller.ts
│       │   │   └── review.controller.ts
│       │   ├── services/
│       │   │   ├── auth.service.ts
│       │   │   ├── decision.service.ts
│       │   │   ├── hypothesis.service.ts
│       │   │   ├── evidence.service.ts
│       │   │   └── review.service.ts
│       │   ├── middleware/
│       │   │   ├── auth.middleware.ts
│       │   │   ├── error.middleware.ts
│       │   │   ├── validate.middleware.ts
│       │   │   └── ownership.middleware.ts
│       │   └── utils/
│       │       ├── api-error.ts
│       │       └── response.ts
│       ├── package.json
│       └── tsconfig.json
│
├── packages/
│   ├── database/                     # Database layer
│   │   ├── src/
│   │   │   ├── index.ts              # Export client & types
│   │   │   ├── client.ts             # Drizzle client
│   │   │   ├── schema/
│   │   │   │   ├── index.ts
│   │   │   │   ├── user.ts
│   │   │   │   ├── decision.ts
│   │   │   │   ├── hypothesis.ts
│   │   │   │   ├── confidence-snapshot.ts
│   │   │   │   ├── evidence.ts
│   │   │   │   ├── review.ts
│   │   │   │   └── hypothesis-assessment.ts
│   │   │   └── seed.ts
│   │   ├── drizzle/
│   │   │   └── migrations/           # SQL migrations
│   │   ├── drizzle.config.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── shared/                       # Shared types & validation
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── schemas/
│   │   │   │   ├── auth.schema.ts
│   │   │   │   ├── decision.schema.ts
│   │   │   │   ├── hypothesis.schema.ts
│   │   │   │   ├── evidence.schema.ts
│   │   │   │   └── review.schema.ts
│   │   │   ├── types/
│   │   │   │   ├── api.types.ts
│   │   │   │   ├── decision.types.ts
│   │   │   │   └── enums.ts
│   │   │   └── constants/
│   │   │       └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── auth/                         # Authentication package
│       ├── src/
│       │   ├── index.ts
│       │   ├── password.ts           # bcrypt hash/verify
│       │   ├── jwt.ts                # JWT sign/verify
│       │   └── types.ts
│       ├── package.json
│       └── tsconfig.json
│
├── docs/
│   ├── PRD.md
│   ├── ARCHITECTURE.md               # Index document
│   └── specs/                        # Detailed specs
│
├── .env.example
├── .gitignore
├── docker-compose.yml
├── package.json                      # Root package.json
├── pnpm-workspace.yaml
├── turbo.json
└── tsconfig.base.json
```

## Package Dependencies

```
@repo/web
  └── @repo/shared

@repo/api
  ├── @repo/database
  ├── @repo/shared
  └── @repo/auth

@repo/auth
  └── bcrypt, jsonwebtoken (no internal deps)

@repo/database
  └── (no internal deps)

@repo/shared
  └── (no internal deps)
```
