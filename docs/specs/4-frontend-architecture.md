# 4. Frontend Architecture

## 4.1 Goal Alignment

| Goal ID | Goal Name                        | Coverage                             |
| ------- | -------------------------------- | ------------------------------------ |
| `g-19`  | Global site header               | 全站共用 header 結構與狀態顯示規範   |
| `g-20`  | Page-oriented frontend structure | 以前端頁面為主體的檔案切分與責任邊界 |

## 4.2 Routes

| Route                 | Purpose                                     |
| --------------------- | ------------------------------------------- |
| `/`                   | Dashboard                                   |
| `/auth/login`         | Login                                       |
| `/auth/register`      | Register                                    |
| `/templates`          | Template list/create/edit                   |
| `/train/start`        | Start workout from gym/template             |
| `/train/$sessionId`   | Workout editor (in-progress + history edit) |
| `/workouts/history`   | Workout history list                        |
| `/progress`           | Exercise progress charts                    |
| `/friends`            | Friends management                          |
| `/crews`              | Crew management                             |
| `/feed`               | Friend activity feed                        |
| `/checkins`           | Daily check-in list/streak                  |
| `/users/$userId`      | Public profile                              |
| `/settings/privacy`   | Privacy settings                            |
| `/settings/reminders` | Reminder settings                           |

## 4.3 Page-oriented Structure (`g-20`)

```text
/web
  /src
    /routes
      /auth
        /_components
        /_domain
        login.tsx
        register.tsx
    /providers
      auth-gate.tsx
      index.tsx
    /lib
```

1. 前端主切分以 `src/routes/*` 頁面為單位，不使用全域 `features/*`、`domain/*` 作為第一層切分。
2. 頁面私有 UI 與邏輯放在該 route 底下（例如 `/_components`、`/_domain`）。
3. 需要跨頁重用的 feature/domain 模組統一放在 `src/lib`。
4. `src/providers/index.tsx` 必須集中所有 providers，並只對外匯出一個 `Provider` 元件。
5. `src/providers/auth-gate.tsx` 作為 auth gating 能力的獨立 provider 模組。

## 4.4 Data Fetching

1. TanStack Query for server state
2. Route loader for route-level prefetch
3. Mutations invalidate corresponding query keys

## 4.5 Key Query Keys

1. `['workout-history', userId, cursor]`
2. `['workout-session', sessionId]`
3. `['exercise-last-best', exerciseId, gymId]`
4. `['progress-chart', exerciseId, chartType, from, to, gymId]`
5. `['dashboard', userId, weekStart]`
6. `['checkins', userId, cursor]`
7. `['feed', userId, cursor]`
8. `['user-profile', targetUserId, viewerUserId]`
9. `['reminders', userId]`
10. `['share-card-templates', planTier]`
