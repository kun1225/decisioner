# 2. Monorepo Structure

## 2.1 Workspace Layout

```text
decisioner/
├── apps/
│   ├── web/                                      # TanStack Start frontend
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   │   ├── __root.tsx                   # App shell + auth bootstrap
│   │   │   │   ├── index.tsx                    # Dashboard
│   │   │   │   ├── login.tsx
│   │   │   │   ├── register.tsx
│   │   │   │   ├── templates/
│   │   │   │   │   ├── index.tsx                # Template list
│   │   │   │   │   ├── new.tsx                  # Create template
│   │   │   │   │   └── $templateId/
│   │   │   │   │       ├── index.tsx            # Edit template
│   │   │   │   │       └── versions.tsx         # Template version history
│   │   │   │   ├── train/
│   │   │   │   │   ├── start.tsx                # Choose gym/template and start
│   │   │   │   │   └── $sessionId.tsx           # Training editor (live + past edit)
│   │   │   │   ├── workouts/
│   │   │   │   │   └── history.tsx              # Past workouts (date + template)
│   │   │   │   ├── progress/
│   │   │   │   │   └── index.tsx                # Max-weight/volume charts
│   │   │   │   ├── achievements/
│   │   │   │   │   └── index.tsx                # Achievement wall + timeline
│   │   │   │   ├── friends/
│   │   │   │   │   └── index.tsx                # Friend list and latest workout
│   │   │   │   ├── crews/
│   │   │   │   │   └── index.tsx                # Crew and shared templates
│   │   │   │   └── settings/
│   │   │   │       └── privacy.tsx              # Visibility settings
│   │   │   ├── components/
│   │   │   ├── integrations/
│   │   │   └── styles.css
│   │   └── package.json
│   │
│   └── api/                                      # Express backend
│       ├── src/
│       │   ├── index.ts
│       │   ├── app.ts
│       │   ├── middleware/
│       │   │   ├── require-auth.ts
│       │   │   ├── error-handler.ts
│       │   │   └── rate-limit.ts
│       │   ├── modules/
│       │   │   ├── auth/
│       │   │   │   ├── auth.routes.ts
│       │   │   │   ├── auth.controller.ts
│       │   │   │   ├── auth.service.ts
│       │   │   │   └── auth.schema.ts
│       │   │   ├── media/
│       │   │   │   ├── media.routes.ts
│       │   │   │   ├── media.controller.ts
│       │   │   │   ├── media.service.ts
│       │   │   │   └── media.schema.ts
│       │   │   ├── exercises/
│       │   │   │   ├── exercises.routes.ts
│       │   │   │   ├── exercises.controller.ts
│       │   │   │   ├── exercises.service.ts
│       │   │   │   └── exercises.schema.ts
│       │   │   ├── gyms/
│       │   │   │   ├── gyms.routes.ts
│       │   │   │   ├── gyms.controller.ts
│       │   │   │   ├── gyms.service.ts
│       │   │   │   └── gyms.schema.ts
│       │   │   ├── templates/
│       │   │   │   ├── templates.routes.ts
│       │   │   │   ├── templates.controller.ts
│       │   │   │   ├── templates.service.ts
│       │   │   │   └── templates.schema.ts
│       │   │   ├── workouts/
│       │   │   │   ├── workouts.routes.ts
│       │   │   │   ├── workouts.controller.ts
│       │   │   │   ├── workouts.service.ts
│       │   │   │   └── workouts.schema.ts
│       │   │   ├── progress/
│       │   │   │   ├── progress.routes.ts
│       │   │   │   ├── progress.controller.ts
│       │   │   │   └── progress.service.ts
│       │   │   ├── social/
│       │   │   │   ├── social.routes.ts
│       │   │   │   ├── social.controller.ts
│       │   │   │   ├── social.service.ts
│       │   │   │   └── social.schema.ts
│       │   │   ├── privacy/
│       │   │   │   ├── privacy.routes.ts
│       │   │   │   ├── privacy.controller.ts
│       │   │   │   └── privacy.service.ts
│       │   │   └── achievements/
│       │   │       ├── achievements.routes.ts
│       │   │       ├── achievements.controller.ts
│       │   │       └── achievements.service.ts
│       │   └── utils/
│       └── package.json
│
├── packages/
│   ├── database/                                 # Drizzle schema + migrations
│   ├── shared/                                   # Zod schemas / shared DTOs
│   ├── auth/                                     # JWT + password utilities
│   ├── ui/
│   ├── eslint-config/
│   └── typescript-config/
│
└── docs/
    ├── PRD.md
    ├── ARCHITECTURE.md
    └── specs/
```

## 2.2 Web Routes (Detailed)

| Route                             | File                                                     | Description                                       | Auth |
| --------------------------------- | -------------------------------------------------------- | ------------------------------------------------- | ---- |
| `/`                               | `apps/web/src/routes/index.tsx`                          | Dashboard / quick actions                         | Yes  |
| `/login`                          | `apps/web/src/routes/login.tsx`                          | Local/Google login                                | No   |
| `/register`                       | `apps/web/src/routes/register.tsx`                       | Registration                                      | No   |
| `/templates`                      | `apps/web/src/routes/templates/index.tsx`                | Template list                                     | Yes  |
| `/templates/new`                  | `apps/web/src/routes/templates/new.tsx`                  | Create template                                   | Yes  |
| `/templates/:templateId`          | `apps/web/src/routes/templates/$templateId/index.tsx`    | Edit template                                     | Yes  |
| `/templates/:templateId/versions` | `apps/web/src/routes/templates/$templateId/versions.tsx` | Template edit history                             | Yes  |
| `/train/start`                    | `apps/web/src/routes/train/start.tsx`                    | Select gym/template and start session             | Yes  |
| `/train/:sessionId`               | `apps/web/src/routes/train/$sessionId.tsx`               | Training editor (supports completed session edit) | Yes  |
| `/workouts/history`               | `apps/web/src/routes/workouts/history.tsx`               | Past workouts list (date + template)              | Yes  |
| `/progress`                       | `apps/web/src/routes/progress/index.tsx`                 | Exercise progress charts                          | Yes  |
| `/achievements`                   | `apps/web/src/routes/achievements/index.tsx`             | Achievements and timeline                         | Yes  |
| `/friends`                        | `apps/web/src/routes/friends/index.tsx`                  | Friends and latest workout                        | Yes  |
| `/crews`                          | `apps/web/src/routes/crews/index.tsx`                    | Crew management and shared templates              | Yes  |
| `/settings/privacy`               | `apps/web/src/routes/settings/privacy.tsx`               | Workout visibility settings                       | Yes  |

## 2.3 API Endpoints by Module (Detailed)

### Auth

1. `POST /api/auth/register`
2. `POST /api/auth/login`
3. `POST /api/auth/google`
4. `POST /api/auth/refresh`
5. `POST /api/auth/logout`
6. `GET /api/auth/me`

### Media

1. `POST /api/media/upload-url`
2. `POST /api/media/complete`

### Exercises

1. `GET /api/exercises/preset`
2. `POST /api/exercises/custom`
3. `GET /api/exercises/:exerciseId`

### Gyms

1. `POST /api/gyms`
2. `POST /api/gyms/:gymId/equipments`
3. `GET /api/gyms/:gymId/equipments`

### Templates

1. `POST /api/templates`
2. `GET /api/templates`
3. `GET /api/templates/:templateId`
4. `PATCH /api/templates/:templateId`
5. `POST /api/templates/:templateId/items`
6. `PATCH /api/templates/:templateId/items/:itemId`
7. `DELETE /api/templates/:templateId/items/:itemId`
8. `GET /api/templates/:templateId/versions`
9. `POST /api/templates/:templateId/share`

### Workouts

1. `POST /api/workouts/start`
2. `GET /api/workouts/:sessionId`
3. `PATCH /api/workouts/:sessionId`
4. `PATCH /api/workouts/:sessionId/items/:itemId`
5. `POST /api/workouts/:sessionId/items`
6. `POST /api/workouts/:sessionId/sets`
7. `PATCH /api/workouts/:sessionId/sets/:setId`
8. `DELETE /api/workouts/:sessionId/sets/:setId`
9. `POST /api/workouts/:sessionId/finish`
10. `GET /api/workouts/history`

### Progress

1. `GET /api/progress/exercises/:exerciseId/last-best`
2. `GET /api/progress/exercises/:exerciseId/charts/max-weight`
3. `GET /api/progress/exercises/:exerciseId/charts/volume`

### Social

1. `POST /api/friends/invite`
2. `POST /api/friends/:friendId/accept`
3. `GET /api/friends/:friendId/latest-workout`

### Privacy

1. `PUT /api/privacy-settings`

### Achievements

1. `GET /api/achievements`
2. `GET /api/achievements/timeline`

## 2.4 Package Responsibilities

1. `@repo/database`: schema、relations、migrations、db client
2. `@repo/shared`: request/response schema、enum、domain DTO
3. `@repo/auth`: token sign/verify、password hash/verify
4. `@repo/ui`: shared UI components

## 2.5 Package Dependencies

```text
apps/web -> @repo/shared, @repo/ui
apps/api -> @repo/database, @repo/shared, @repo/auth
@repo/database -> (no app dependencies)
@repo/shared -> (no app dependencies)
@repo/auth -> (no app dependencies)
```

## 2.6 Dependency Rules

1. `apps/*` 可以依賴 `packages/*`
2. `packages/*` 不可依賴 `apps/*`
3. 禁止 package 循環依賴
4. `@repo/database` 只負責資料存取，不包含 HTTP 或 UI 邏輯
