# Appendix D: Technical Architecture

## Technical Architecture (High-Level)

### Stack

| Layer    | Technology      | Rationale                                   |
| -------- | --------------- | ------------------------------------------- |
| Frontend | TanStack Start  | Modern full-stack React framework           |
| API      | Express.js      | Flexible, well-known Node.js framework      |
| Database | PostgreSQL      | ACID compliance for immutability guarantees |
| Monorepo | pnpm workspaces | Efficient dependency management             |

### Package Structure

```
decisioner/
├── apps/
│   ├── web/              # TanStack Start frontend
│   └── api/              # Express.js backend
├── packages/
│   ├── database/         # Prisma/Drizzle schema, migrations
│   ├── shared/           # Shared types, validation schemas
│   └── ui/               # Shared UI components (optional)
├── package.json
├── pnpm-workspace.yaml
└── turbo.json            # Turborepo config
```

### Key Technical Decisions

1. **Immutability at DB level**
   - Use soft deletes and append-only patterns
   - Audit trail via created_at timestamps
   - No UPDATE on frozen records (enforce in API)

2. **Confidence History**
   - Separate table for snapshots
   - Current confidence = latest snapshot
   - Full history queryable

3. **API Design**
   - REST endpoints for CRUD
   - Decision-centric resource hierarchy
   - Proper status code usage (409 for invalid state transitions)

---
