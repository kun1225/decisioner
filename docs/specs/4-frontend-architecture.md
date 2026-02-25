# 4. Frontend Architecture

## 4.1 Routes

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

## 4.2 Page-oriented Structure

1. 前端主切分以 `src/routes/*` 頁面為單位，不使用全域 `features/*`、`domain/*` 作為第一層切分。
2. 頁面私有 UI 與邏輯放在該 route 底下（例如 `/_components`、`/_domain`）。
3. 需要跨頁重用的 feature/domain 模組統一放在 `src/features`。
4. 其他共用函數統一放在 `src/lib`。
5. `src/providers/index.tsx` 必須集中所有 providers，並只對外匯出一個 `Provider` 元件。

參考：

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
    /features
```

## 4.3 Data Fetching

1. TanStack Query for server state
2. Route loader for route-level prefetch
3. Mutations invalidate corresponding query keys
