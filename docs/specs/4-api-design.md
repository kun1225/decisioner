# 4. API Design

## 4.1 Base Contract

1. Base path: `/api`
2. Auth: Bearer token（refresh 使用 HttpOnly cookie）
3. Response: JSON

## 4.2 Auth

| Method | Endpoint | Description | Auth |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | Register local account | No |
| POST | `/api/auth/login` | Login local account | No |
| POST | `/api/auth/google` | Login via Google idToken | No |
| POST | `/api/auth/refresh` | Rotate refresh token | No (cookie) |
| POST | `/api/auth/logout` | Revoke refresh token | No (cookie) |
| GET | `/api/auth/me` | Current user profile | Yes |

## 4.3 Media

| Method | Endpoint | Description | Auth |
| --- | --- | --- | --- |
| POST | `/api/media/upload-url` | Get pre-signed upload URL | Yes |
| POST | `/api/media/complete` | Confirm upload and bind media | Yes |

## 4.4 Exercises

| Method | Endpoint | Description | Auth |
| --- | --- | --- | --- |
| GET | `/api/exercises/preset` | List preset exercises | Yes |
| POST | `/api/exercises/custom` | Create custom exercise | Yes |
| GET | `/api/exercises/:exerciseId` | Exercise detail | Yes |

## 4.5 Gyms

| Method | Endpoint | Description | Auth |
| --- | --- | --- | --- |
| POST | `/api/gyms` | Create gym | Yes |
| POST | `/api/gyms/:gymId/equipments` | Create equipment | Yes |
| GET | `/api/gyms/:gymId/equipments` | List equipment | Yes |

## 4.6 Templates

| Method | Endpoint | Description | Auth |
| --- | --- | --- | --- |
| POST | `/api/templates` | Create template | Yes |
| GET | `/api/templates` | List own/shared templates | Yes |
| GET | `/api/templates/:templateId` | Get template detail | Yes |
| PATCH | `/api/templates/:templateId` | Update template meta | Yes |
| POST | `/api/templates/:templateId/items` | Add template item | Yes |
| PATCH | `/api/templates/:templateId/items/:itemId` | Update item | Yes |
| DELETE | `/api/templates/:templateId/items/:itemId` | Remove item | Yes |
| GET | `/api/templates/:templateId/versions` | Version history | Yes |
| POST | `/api/templates/:templateId/share` | Share template to crew | Yes |

## 4.7 Workouts

| Method | Endpoint | Description | Auth |
| --- | --- | --- | --- |
| POST | `/api/workouts/start` | Start session from template/manual | Yes |
| GET | `/api/workouts/:sessionId` | Session detail (editor source) | Yes |
| PATCH | `/api/workouts/:sessionId` | Update session meta/date | Yes |
| PATCH | `/api/workouts/:sessionId/items/:itemId` | Replace/update session item | Yes |
| POST | `/api/workouts/:sessionId/items` | Add manual item | Yes |
| POST | `/api/workouts/:sessionId/sets` | Add set | Yes |
| PATCH | `/api/workouts/:sessionId/sets/:setId` | Edit set | Yes |
| DELETE | `/api/workouts/:sessionId/sets/:setId` | Delete set | Yes |
| POST | `/api/workouts/:sessionId/finish` | Mark session completed | Yes |
| GET | `/api/workouts/history` | List past sessions (date/template) | Yes |

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

## 4.8 Progress

| Method | Endpoint | Description | Auth |
| --- | --- | --- | --- |
| GET | `/api/progress/exercises/:exerciseId/last-best` | Last + best summary | Yes |
| GET | `/api/progress/exercises/:exerciseId/charts/max-weight` | Max weight over time | Yes |
| GET | `/api/progress/exercises/:exerciseId/charts/volume` | Volume over time | Yes |

## 4.9 Social

| Method | Endpoint | Description | Auth |
| --- | --- | --- | --- |
| POST | `/api/friends/invite` | Send friend request | Yes |
| POST | `/api/friends/:friendId/accept` | Accept friend request | Yes |
| GET | `/api/friends/:friendId/latest-workout` | Friend latest workout | Yes |

## 4.10 Privacy

| Method | Endpoint | Description | Auth |
| --- | --- | --- | --- |
| PUT | `/api/privacy-settings` | Update workout visibility settings | Yes |

## 4.11 Achievements

| Method | Endpoint | Description | Auth |
| --- | --- | --- | --- |
| GET | `/api/achievements` | List achievements | Yes |
| GET | `/api/achievements/timeline` | Achievement timeline | Yes |

## 4.12 Error Contract

| HTTP | Meaning |
| --- | --- |
| 400 | Validation error |
| 401 | Not authenticated |
| 403 | Not authorized / blocked by privacy |
| 404 | Resource not found |
| 409 | Version conflict / invalid transition |
| 422 | Business rule failed |
| 429 | Rate limit |
