# 4. API Design

## 4.1 Base Contract

1. Base path: `/api`
2. Auth: Bearer token（refresh 使用 HttpOnly cookie）
3. Response: JSON

## 4.2 Auth

| Method | Endpoint             | Description              | Auth        |
| ------ | -------------------- | ------------------------ | ----------- |
| POST   | `/api/auth/register` | Register local account   | No          |
| POST   | `/api/auth/login`    | Login local account      | No          |
| POST   | `/api/auth/google`   | Login via Google idToken | No          |
| POST   | `/api/auth/refresh`  | Rotate refresh token     | No (cookie) |
| POST   | `/api/auth/logout`   | Revoke refresh token     | No (cookie) |
| GET    | `/api/auth/me`       | Current user profile     | Yes         |

## 4.3 Media

| Method | Endpoint                | Description                   | Auth |
| ------ | ----------------------- | ----------------------------- | ---- |
| POST   | `/api/media/upload-url` | Get pre-signed upload URL     | Yes  |
| POST   | `/api/media/complete`   | Confirm upload and bind media | Yes  |

## 4.4 Exercises

| Method | Endpoint                     | Description            | Auth |
| ------ | ---------------------------- | ---------------------- | ---- |
| GET    | `/api/exercises/preset`      | List preset exercises  | Yes  |
| POST   | `/api/exercises/custom`      | Create custom exercise | Yes  |
| GET    | `/api/exercises/:exerciseId` | Exercise detail        | Yes  |

## 4.5 Gyms

| Method | Endpoint    | Description   | Auth |
| ------ | ----------- | ------------- | ---- |
| POST   | `/api/gyms` | Create gym    | Yes  |
| GET    | `/api/gyms` | List own gyms | Yes  |

## 4.6 Templates

| Method | Endpoint                                   | Description               | Auth |
| ------ | ------------------------------------------ | ------------------------- | ---- |
| POST   | `/api/templates`                           | Create template           | Yes  |
| GET    | `/api/templates`                           | List own/shared templates | Yes  |
| GET    | `/api/templates/:templateId`               | Get template detail       | Yes  |
| PATCH  | `/api/templates/:templateId`               | Update template meta      | Yes  |
| POST   | `/api/templates/:templateId/items`         | Add template item         | Yes  |
| PATCH  | `/api/templates/:templateId/items/:itemId` | Update item               | Yes  |
| DELETE | `/api/templates/:templateId/items/:itemId` | Remove item               | Yes  |
| GET    | `/api/templates/:templateId/versions`      | Version history           | Yes  |
| POST   | `/api/templates/:templateId/share`         | Share template to crew    | Yes  |

## 4.7 Workouts

| Method | Endpoint                                 | Description                                         | Auth |
| ------ | ---------------------------------------- | --------------------------------------------------- | ---- |
| POST   | `/api/workouts/start`                    | Start session from template/manual                  | Yes  |
| GET    | `/api/workouts/:sessionId`               | Session detail (editor source)                      | Yes  |
| PATCH  | `/api/workouts/:sessionId`               | Update session meta/date                            | Yes  |
| PATCH  | `/api/workouts/:sessionId/items/:itemId` | Replace/update session item                         | Yes  |
| POST   | `/api/workouts/:sessionId/items`         | Add manual item                                     | Yes  |
| POST   | `/api/workouts/:sessionId/sets`          | Add set（MVP: weight/reps/unit；Pro 可含 rpe/rir）  | Yes  |
| PATCH  | `/api/workouts/:sessionId/sets/:setId`   | Edit set（MVP: weight/reps/unit；Pro 可含 rpe/rir） | Yes  |
| DELETE | `/api/workouts/:sessionId/sets/:setId`   | Delete set                                          | Yes  |
| POST   | `/api/workouts/:sessionId/finish`        | Mark session completed                              | Yes  |
| GET    | `/api/workouts/history`                  | List past sessions (date/template)                  | Yes  |

### `GET /api/workouts/history` response (example)

```json
{
  "items": [
    {
      "sessionId": "8b8f...",
      "sessionDate": "2026-02-08",
      "templateName": "Chest A",
      "status": "COMPLETED",
      "lastEditedAt": "2026-02-09T02:20:11.000Z"
    }
  ],
  "nextCursor": null
}
```

### Past Workout Editing Rule

1. 已完成的 session 可由 `/api/workouts/history` 列表進入編輯流程
2. 編輯後狀態仍維持 `COMPLETED`
3. 系統建立 `workout_session_revisions`，並重算 metrics/achievements

## 4.8 Progress (MVP Free)

| Method | Endpoint                                                | Description          | Auth |
| ------ | ------------------------------------------------------- | -------------------- | ---- |
| GET    | `/api/progress/exercises/:exerciseId/last-best`         | Last + best summary  | Yes  |
| GET    | `/api/progress/exercises/:exerciseId/charts/max-weight` | Max weight over time | Yes  |
| GET    | `/api/progress/exercises/:exerciseId/charts/volume`     | Volume over time     | Yes  |

> **Pro (Paid)**
>
> 詳見 **[12-pro-features.md](./12-pro-features.md)** 包含 e1RM, Weekly Muscle Volume, Adherence, Suggested Load API endpoints.

## 4.9 Dashboard / Check-in / Feed (MVP)

| Method | Endpoint                     | Description                                     | Auth |
| ------ | ---------------------------- | ----------------------------------------------- | ---- |
| GET    | `/api/dashboard`             | Dashboard summary（週訓練、streak、近期活動）   | Yes  |
| POST   | `/api/checkins`              | Create daily check-in（可綁 session）           | Yes  |
| GET    | `/api/checkins`              | List own check-ins                              | Yes  |
| GET    | `/api/feed`                  | Friend activity feed                            | Yes  |
| POST   | `/api/feed/:eventId/likes`   | Like an activity event                          | Yes  |
| DELETE | `/api/feed/:eventId/likes`   | Unlike an activity event                        | Yes  |
| GET    | `/api/users/:userId/profile` | Basic profile page data（受隱私設定）           | Yes  |
| GET    | `/api/reminders`             | List reminder settings                          | Yes  |
| PUT    | `/api/reminders/:reminderId` | Update reminder settings                        | Yes  |
| GET    | `/api/share-cards/templates` | List share card templates（依方案回傳可用模板） | Yes  |
| POST   | `/api/share-cards/render`    | Render share card image                         | Yes  |

### Share card entitlement rule

1. 免費版僅可使用 `tier=FREE` 模板
2. Pro 可使用 `tier=FREE|PRO` 模板
3. 非法模板使用回傳 `403 PLAN_REQUIRED`

## 4.10 Goals

> 僅 Pro 可用，詳見 **[12-pro-features.md](./12-pro-features.md)**

## 4.11 Social (MVP Free-Lite)

| Method | Endpoint                                | Description           | Auth |
| ------ | --------------------------------------- | --------------------- | ---- |
| POST   | `/api/friends/invite`                   | Send friend request   | Yes  |
| POST   | `/api/friends/:friendId/accept`         | Accept friend request | Yes  |
| GET    | `/api/friends/:friendId/latest-workout` | Friend latest workout | Yes  |
| POST   | `/api/crews`                            | Create crew           | Yes  |
| GET    | `/api/crews`                            | List own crews        | Yes  |
| POST   | `/api/crews/:crewId/members`            | Add member to crew    | Yes  |

### Free-Lite limits (enforced by API)

1. 每位使用者最多建立 1 個 crew
2. 每個 crew 最多 2 位成員（owner + 1）
3. 超限回傳 `422`（`FREE_TIER_LIMIT_EXCEEDED`）

## 4.12 Privacy

| Method | Endpoint                | Description                        | Auth |
| ------ | ----------------------- | ---------------------------------- | ---- |
| PUT    | `/api/privacy-settings` | Update workout visibility settings | Yes  |

## 4.13 Achievements

| Method | Endpoint                     | Description          | Auth |
| ------ | ---------------------------- | -------------------- | ---- |
| GET    | `/api/achievements`          | List achievements    | Yes  |
| GET    | `/api/achievements/timeline` | Achievement timeline | Yes  |

## 4.14 Error Contract

| HTTP | Meaning                               |
| ---- | ------------------------------------- |
| 400  | Validation error                      |
| 401  | Not authenticated                     |
| 403  | Not authorized / blocked by privacy   |
| 404  | Resource not found                    |
| 409  | Version conflict / invalid transition |
| 422  | Business rule failed                  |
| 429  | Rate limit                            |
