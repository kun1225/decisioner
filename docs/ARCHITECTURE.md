# Decision Log - Architecture Document

> **Version:** 1.0.0
> **Status:** Approved
> **Last Updated:** 2026-02-05

---

## 1. Overview

Decision Log 使用 monorepo 架構，採用 pnpm workspaces + Turborepo 管理多個 packages。

### Tech Stack

| Layer           | Technology             | Version |
| --------------- | ---------------------- | ------- |
| Frontend        | TanStack Start         | ^1.x    |
| Backend API     | Express.js             | ^4.x    |
| Database        | PostgreSQL             | 16      |
| ORM             | Drizzle ORM            | ^0.29   |
| Authentication  | DIY (**bcrypt** + JWT) | -       |
| Validation      | Zod                    | ^3.x    |
| Package Manager | pnpm                   | ^8.x    |
| Build System    | Turborepo              | ^2.x    |

---

## 2. Technology Decisions

### 2.1 ORM: Drizzle (over Prisma)

**Decision:** 選擇 Drizzle ORM

**Rationale:**

| Aspect          | Drizzle                | Prisma                 |
| --------------- | ---------------------- | ---------------------- |
| Bundle Size     | ~35KB                  | ~2MB                   |
| SQL Control     | 完整控制，可寫 raw SQL | 抽象層，較難優化       |
| Code Generation | 不需要                 | 需要 `prisma generate` |
| Type Safety     | SQL-like 語法推導      | 從 schema 生成         |
| Monorepo        | 簡單 package           | 需要 generate step     |

**For this project:**

1. Confidence snapshot 需要 SQL-level 控制（history 查詢、aggregation）
2. TanStack Start server functions 需要輕量 bundle
3. Monorepo 不需要額外的 code generation step

---

### 2.2 Authentication: DIY (bcrypt + JWT)

**Decision:** 使用 bcrypt + jsonwebtoken

**Rationale:**

| Aspect       | DIY (bcrypt + JWT)     | Lucia        | Clerk           | Auth.js           |
| ------------ | ---------------------- | ------------ | --------------- | ----------------- |
| Philosophy   | Full control, no magic | Low-level    | Managed service | Framework-focused |
| Express 整合 | 原生支援               | 需要 adapter | SDK             | 主要為 Next.js    |
| 成本         | 免費                   | 免費         | 付費            | 免費              |
| Session 管理 | JWT（stateless）       | DB session   | 託管            | DB session        |
| 學習價值     | 高                     | 中           | 低              | 中                |

**For this project:**

1. Express.js 後端原生整合，無需額外 adapter
2. JWT token-based 適合 SPA + API 分離架構（TanStack Start + Express）
3. API server 不需維護 session 狀態（stateless）
4. Lucia 作者已建議改為 DIY（官網公告）
5. 用 bcrypt（密碼雜湊）+ jsonwebtoken 皆為成熟穩定的 npm 套件

---

## 3. Monorepo Structure

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
│   └── ARCHITECTURE.md               # This file
│
├── .env.example
├── .gitignore
├── docker-compose.yml
├── package.json                      # Root package.json
├── pnpm-workspace.yaml
├── turbo.json
└── tsconfig.base.json
```

---

## 4. Database Schema

### 4.1 Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         users                                   │
├─────────────────────────────────────────────────────────────────┤
│ id: uuid (PK)                                                   │
│ email: varchar(255) UNIQUE                                      │
│ name: varchar(255)                                              │
│ hashed_password: varchar(255)                                   │
│ created_at: timestamp                                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ 1:N
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        decisions                                │
├─────────────────────────────────────────────────────────────────┤
│ id: uuid (PK)                                                   │
│ user_id: uuid (FK → users)                                      │
│ title: varchar(200) NOT NULL                                    │
│ description: text                                               │
│ context: text                                                   │
│ expected_outcome: text                                          │
│ final_choice: text (nullable, filled on freeze)                 │
│ status: enum [DRAFT, ACTIVE, CLOSED]                            │
│ category: varchar(100)                                          │
│ created_at: timestamp                                           │
│ frozen_at: timestamp (nullable)                                 │
│ closed_at: timestamp (nullable)                                 │
└─────────────────────────────────────────────────────────────────┘
         │                    │                    │
         │ 1:N                │ 1:N                │ 1:N
         ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   hypotheses    │  │    evidence     │  │     reviews     │
├─────────────────┤  ├─────────────────┤  ├─────────────────┤
│ id: uuid (PK)   │  │ id: uuid (PK)   │  │ id: uuid (PK)   │
│ decision_id: FK │  │ decision_id: FK │  │ decision_id: FK │
│ content: text   │  │ hypothesis_id?  │  │ outcome: text   │
│ order: int      │  │ content: text   │  │ lessons: text   │
│ created_at      │  │ url: varchar?   │  │ created_at      │
└────────┬────────┘  │ created_at      │  └────────┬────────┘
         │           └─────────────────┘           │
         │ 1:N                                     │ 1:N
         ▼                                         ▼
┌─────────────────────────────────┐  ┌─────────────────────────────────┐
│      confidence_snapshots       │  │     hypothesis_assessments      │
├─────────────────────────────────┤  ├─────────────────────────────────┤
│ id: uuid (PK)                   │  │ id: uuid (PK)                   │
│ hypothesis_id: uuid (FK)        │  │ review_id: uuid (FK)            │
│ confidence: int (0-100)         │  │ hypothesis_id: uuid (FK)        │
│ reason: text                    │  │ assessment: enum                │
│ created_at: timestamp           │  │ note: text                      │
│ is_frozen: boolean              │  └─────────────────────────────────┘
└─────────────────────────────────┘

Note: Authentication uses JWT (stateless), no sessions table needed.
```

### 4.2 Indexes

| Table                  | Index                                  | Columns       |
| ---------------------- | -------------------------------------- | ------------- |
| decisions              | decisions_user_id_idx                  | user_id       |
| decisions              | decisions_status_idx                   | status        |
| decisions              | decisions_created_at_idx               | created_at    |
| hypotheses             | hypotheses_decision_id_idx             | decision_id   |
| confidence_snapshots   | confidence_snapshots_hypothesis_id_idx | hypothesis_id |
| confidence_snapshots   | confidence_snapshots_created_at_idx    | created_at    |
| evidence               | evidence_decision_id_idx               | decision_id   |
| evidence               | evidence_hypothesis_id_idx             | hypothesis_id |
| reviews                | reviews_decision_id_idx                | decision_id   |
| hypothesis_assessments | hypothesis_assessments_review_id_idx   | review_id     |

### 4.3 Enums

```sql
-- Decision Status
CREATE TYPE decision_status AS ENUM ('DRAFT', 'ACTIVE', 'CLOSED');

-- Hypothesis Assessment
CREATE TYPE hypothesis_assessment AS ENUM ('CONFIRMED', 'PARTIALLY', 'WRONG', 'UNKNOWN');
```

---

## 5. API Design

### 5.1 Authentication Endpoints

| Method | Endpoint             | Description               | Auth Required |
| ------ | -------------------- | ------------------------- | ------------- |
| POST   | `/api/auth/register` | Create new account        | No            |
| POST   | `/api/auth/login`    | Login with email/password | No            |
| POST   | `/api/auth/logout`   | Client-side token removal | Yes           |
| GET    | `/api/auth/me`       | Get current user info     | Yes           |

### 5.2 Decision Endpoints

| Method | Endpoint                     | Description               | State Constraint |
| ------ | ---------------------------- | ------------------------- | ---------------- |
| GET    | `/api/decisions`             | List user's decisions     | -                |
| POST   | `/api/decisions`             | Create new decision       | -                |
| GET    | `/api/decisions/:id`         | Get decision with details | Owner only       |
| PATCH  | `/api/decisions/:id`         | Update decision fields    | **DRAFT only**   |
| POST   | `/api/decisions/:id/freeze`  | Freeze decision           | **DRAFT only**   |
| POST   | `/api/decisions/:id/close`   | Close decision            | **ACTIVE only**  |
| GET    | `/api/decisions/:id/history` | Get change history        | Owner only       |

### 5.3 Hypothesis Endpoints

| Method | Endpoint                         | Description               | State Constraint |
| ------ | -------------------------------- | ------------------------- | ---------------- |
| POST   | `/api/decisions/:id/hypotheses`  | Add hypothesis            | **DRAFT only**   |
| PATCH  | `/api/hypotheses/:id`            | Update hypothesis content | **DRAFT only**   |
| DELETE | `/api/hypotheses/:id`            | Delete hypothesis         | **DRAFT only**   |
| POST   | `/api/hypotheses/:id/confidence` | Adjust confidence         | **DRAFT only**   |
| GET    | `/api/hypotheses/:id/history`    | Get confidence history    | Owner only       |

### 5.4 Evidence Endpoints

| Method | Endpoint                      | Description       | State Constraint |
| ------ | ----------------------------- | ----------------- | ---------------- |
| POST   | `/api/decisions/:id/evidence` | Add evidence      | DRAFT or ACTIVE  |
| GET    | `/api/decisions/:id/evidence` | List all evidence | Owner only       |

### 5.5 Review Endpoints

| Method | Endpoint                     | Description      | State Constraint     |
| ------ | ---------------------------- | ---------------- | -------------------- |
| POST   | `/api/decisions/:id/reviews` | Add review       | **ACTIVE or CLOSED** |
| GET    | `/api/decisions/:id/reviews` | List all reviews | Owner only           |

### 5.6 Pattern Endpoints

| Method | Endpoint                | Description                   |
| ------ | ----------------------- | ----------------------------- |
| GET    | `/api/patterns/summary` | Get cross-decision statistics |

### 5.7 Error Codes

| HTTP Code | Scenario                   |
| --------- | -------------------------- |
| 400       | Validation error (Zod)     |
| 401       | Not authenticated          |
| 403       | Not authorized (not owner) |
| 404       | Resource not found         |
| 409       | Invalid state transition   |

---

## 6. State Machine

### 6.1 Decision States

```
                    ┌─────────┐
         ┌──────────│  DRAFT  │──────────┐
         │          └────┬────┘          │
         │               │               │
         │          [Freeze]             │
         │               │               │
         │               ▼               │
         │          ┌─────────┐          │
         │          │ ACTIVE  │          │
         │          └────┬────┘          │
         │               │               │
         │           [Close]             │
         │               │               │
         │               ▼               │
         │          ┌─────────┐          │
         │          │ CLOSED  │          │
         │          └─────────┘          │
         │                               │
         └───────────────────────────────┘
                 (No reverse transitions)
```

### 6.2 State Permissions Matrix

| Operation                     | DRAFT | ACTIVE | CLOSED |
| ----------------------------- | ----- | ------ | ------ |
| Edit title/description        | ✓     | ✗      | ✗      |
| Edit context/expected_outcome | ✓     | ✗      | ✗      |
| Add hypothesis                | ✓     | ✗      | ✗      |
| Edit hypothesis               | ✓     | ✗      | ✗      |
| Delete hypothesis             | ✓     | ✗      | ✗      |
| Adjust confidence             | ✓     | ✗      | ✗      |
| Add evidence                  | ✓     | ✓      | ✗      |
| Add review                    | ✗     | ✓      | ✓      |
| View history                  | ✓     | ✓      | ✓      |
| Freeze                        | ✓     | ✗      | ✗      |
| Close                         | ✗     | ✓      | ✗      |

---

## 7. Core Mechanisms

### 7.1 Freeze Mechanism

**Purpose:** 鎖定決策當下的狀態，防止事後修改。

**Implementation:**

```typescript
// decision.service.ts
async freeze(id: string, input: FreezeDecisionInput) {
  return await db.transaction(async (tx) => {
    // 1. Update decision status
    const [updated] = await tx
      .update(decisions)
      .set({
        status: "ACTIVE",
        finalChoice: input.finalChoice,
        frozenAt: new Date(),
      })
      .where(eq(decisions.id, id))
      .returning();

    // 2. Get all hypotheses
    const hypothesisList = await tx
      .select()
      .from(hypotheses)
      .where(eq(hypotheses.decisionId, id));

    // 3. Mark latest confidence snapshot as frozen
    for (const h of hypothesisList) {
      const [latestSnapshot] = await tx
        .select()
        .from(confidenceSnapshots)
        .where(eq(confidenceSnapshots.hypothesisId, h.id))
        .orderBy(desc(confidenceSnapshots.createdAt))
        .limit(1);

      if (latestSnapshot) {
        await tx
          .update(confidenceSnapshots)
          .set({ isFrozen: true })
          .where(eq(confidenceSnapshots.id, latestSnapshot.id));
      }
    }

    return updated;
  });
}
```

**Key Points:**

- 使用 transaction 確保原子性
- 每個 hypothesis 的最新 confidence snapshot 會被標記為 `is_frozen: true`
- `frozen_at` timestamp 記錄凍結時間

---

### 7.2 Confidence History (Append-Only)

**Purpose:** 保留所有信心值變更的歷史記錄。

**Pattern:** 永遠 INSERT 新的 snapshot，不 UPDATE 既有記錄。

```typescript
// hypothesis.service.ts
async adjustConfidence(hypothesisId: string, input: UpdateConfidenceInput) {
  // Always INSERT new row, never UPDATE
  const [snapshot] = await db
    .insert(confidenceSnapshots)
    .values({
      hypothesisId,
      confidence: input.confidence,
      reason: input.reason,  // Required: why the change?
    })
    .returning();

  return snapshot;
}

// Get current confidence (latest snapshot)
async getCurrentConfidence(hypothesisId: string) {
  const [latest] = await db
    .select()
    .from(confidenceSnapshots)
    .where(eq(confidenceSnapshots.hypothesisId, hypothesisId))
    .orderBy(desc(confidenceSnapshots.createdAt))
    .limit(1);

  return latest?.confidence ?? null;
}

// Get full history
async getConfidenceHistory(hypothesisId: string) {
  return await db
    .select()
    .from(confidenceSnapshots)
    .where(eq(confidenceSnapshots.hypothesisId, hypothesisId))
    .orderBy(asc(confidenceSnapshots.createdAt));
}
```

**Key Points:**

- 當前信心值 = 最新的 snapshot
- 歷史查詢按 `created_at` 排序
- `is_frozen` 標記凍結時刻的值（用於顯示「凍結時的信心」）

---

### 7.3 State Validation Middleware

**Purpose:** 在 API 層阻擋非法的狀態操作。

```typescript
// In controller
async update(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const decision = await decisionService.findById(id);

    // 1. Check existence
    if (!decision) {
      throw new ApiError(404, "Decision not found");
    }

    // 2. Check ownership
    if (decision.userId !== req.user!.id) {
      throw new ApiError(403, "Not authorized");
    }

    // 3. Check state constraint
    if (decision.status !== "DRAFT") {
      throw new ApiError(409, "Cannot edit frozen decision");
    }

    // Proceed with update...
    const input = updateDecisionSchema.parse(req.body);
    const updated = await decisionService.update(id, input);
    res.json({ data: updated });
  } catch (error) {
    next(error);
  }
}
```

**Error Response for Invalid State:**

```json
{
  "error": {
    "code": 409,
    "message": "Cannot edit frozen decision"
  }
}
```

---

### 7.4 Multi-tenancy (User Isolation)

**Purpose:** 確保使用者只能存取自己的資料。

**Implementation Layers:**

1. **Query Level:** 所有查詢都包含 `user_id` 條件

```typescript
async findAllByUser(userId: string) {
  return await db
    .select()
    .from(decisions)
    .where(eq(decisions.userId, userId))
    .orderBy(desc(decisions.createdAt));
}
```

2. **Middleware Level:** 驗證資源擁有權

```typescript
// ownership.middleware.ts
export async function checkDecisionOwnership(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { id } = req.params
  const decision = await decisionService.findById(id)

  if (!decision) {
    throw new ApiError(404, 'Decision not found')
  }

  if (decision.userId !== req.user!.id) {
    throw new ApiError(403, 'Not authorized')
  }

  req.decision = decision
  next()
}
```

---

## 8. Authentication Flow

### 8.1 JWT Configuration

```typescript
// packages/auth/src/jwt.ts
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET!

export interface JwtPayload {
  userId: string
  email: string
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload
}
```

```typescript
// packages/auth/src/password.ts
import bcrypt from 'bcrypt'

const SALT_ROUNDS = 12

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash)
}
```

### 8.2 Auth Middleware

```typescript
// apps/api/src/middleware/auth.middleware.ts
import { verifyToken } from '@repo/auth'

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers.authorization

  if (!authHeader?.startsWith('Bearer ')) {
    req.user = null
    return next()
  }

  try {
    const token = authHeader.slice(7)
    const payload = verifyToken(token)
    req.user = payload
  } catch {
    req.user = null
  }

  next()
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    throw new ApiError(401, 'Authentication required')
  }
  next()
}
```

### 8.3 Flow Diagrams

**Registration:**

```
POST /api/auth/register { email, password, name }
  → Validate input (Zod)
  → Check email uniqueness
  → Hash password (bcrypt)
  → Create user in database
  → Sign JWT token
  → Return { user, token }
```

**Login:**

```
POST /api/auth/login { email, password }
  → Find user by email
  → Verify password (bcrypt)
  → Sign JWT token
  → Return { user, token }
```

**Authenticated Request:**

```
GET /api/decisions (Authorization: Bearer <token>)
  → Auth middleware extracts token
  → Verify JWT signature & expiry
  → Inject user payload into req.user
  → Proceed to controller
```

---

## 9. Frontend Architecture

### 9.1 Route Structure

| Route                    | Component                 | Description             |
| ------------------------ | ------------------------- | ----------------------- |
| `/`                      | index.tsx                 | Landing / Dashboard     |
| `/login`                 | login.tsx                 | Login form              |
| `/register`              | register.tsx              | Registration form       |
| `/decisions`             | decisions/index.tsx       | Decision list           |
| `/decisions/new`         | decisions/new.tsx         | Create decision         |
| `/decisions/:id`         | decisions/$id/index.tsx   | View/Edit decision      |
| `/decisions/:id/history` | decisions/$id/history.tsx | Confidence timeline     |
| `/decisions/:id/review`  | decisions/$id/review.tsx  | Add/View reviews        |
| `/patterns`              | patterns.tsx              | Cross-decision analysis |

### 9.2 Server Functions vs API Calls

| Use Server Functions      | Use API Calls      |
| ------------------------- | ------------------ |
| Initial page data loading | Real-time updates  |
| Form submissions          | Background sync    |
| Auth-dependent queries    | Optimistic updates |
| SEO-critical content      | Polling            |

### 9.3 State Management

| State Type   | Solution        |
| ------------ | --------------- |
| Server State | TanStack Query  |
| Auth State   | React Context   |
| UI State     | React Context   |
| URL State    | TanStack Router |

---

## 10. Build & Development

### 10.1 Turborepo Pipeline

```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "db:generate": { "cache": false },
    "db:migrate": { "cache": false },
    "lint": { "dependsOn": ["^build"] },
    "type-check": { "dependsOn": ["^build"] },
    "test": { "dependsOn": ["^build"] }
  }
}
```

### 10.2 Package Dependencies

```
@decisioner/web
  └── @decisioner/shared

@decisioner/api
  ├── @decisioner/database
  ├── @decisioner/shared
  └── @decisioner/auth

@repo/auth
  └── bcrypt, jsonwebtoken (no internal deps)

@decisioner/database
  └── (no internal deps)

@decisioner/shared
  └── (no internal deps)
```

### 10.3 Development Scripts

```bash
# Start all services
pnpm dev

# Database operations
pnpm db:generate    # Generate Drizzle client
pnpm db:migrate     # Run migrations
pnpm db:seed        # Seed test data

# Quality checks
pnpm lint           # Run ESLint
pnpm type-check     # Run TypeScript
pnpm test           # Run tests
```

---

## 11. Environment Variables

```bash
# .env.example

# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/decisioner"

# API Server
API_PORT=3001
API_URL="http://localhost:3001"

# Web Server
WEB_PORT=3000

# Authentication (JWT)
JWT_SECRET="your-jwt-secret-at-least-32-chars-long"

# Environment
NODE_ENV="development"
```

---

## 12. Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: decisioner-db
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: decisioner
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

---

## 13. Revision History

| Version | Date       | Author | Changes                                           |
| ------- | ---------- | ------ | ------------------------------------------------- |
| 1.1.0   | 2026-02-06 | -      | Auth: Lucia → DIY (bcrypt + JWT), remove sessions |
| 1.0.0   | 2026-02-05 | -      | Initial architecture document                     |
