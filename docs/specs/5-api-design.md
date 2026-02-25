# 5. API Contract

## 5.1 Base Contract

1. Base path: `/api`
2. Response format: JSON
3. Auth: Bearer token (refresh uses HttpOnly cookie)

## 5.2 Auth (`g-18`)

| Method | Endpoint             | Description                   | Auth        |
| ------ | -------------------- | ----------------------------- | ----------- |
| POST   | `/api/auth/register` | Register account              | No          |
| POST   | `/api/auth/login`    | Login                         | No          |
| POST   | `/api/auth/google`   | Google login                  | No          |
| POST   | `/api/auth/refresh`  | Rotate refresh token          | No (cookie) |
| POST   | `/api/auth/logout`   | Logout / revoke refresh token | No (cookie) |
| GET    | `/api/auth/me`       | Current user profile          | Yes         |

## 5.3 Media (`g-02`)

| Method | Endpoint                | Description               | Auth |
| ------ | ----------------------- | ------------------------- | ---- |
| POST   | `/api/media/upload-url` | Get pre-signed upload URL | Yes  |
| POST   | `/api/media/complete`   | Confirm upload binding    | Yes  |

## 5.4 Exercises (`g-01`, `g-02`)

| Method | Endpoint                     | Description            | Auth |
| ------ | ---------------------------- | ---------------------- | ---- |
| GET    | `/api/exercises/preset`      | List preset exercises  | Yes  |
| POST   | `/api/exercises/custom`      | Create custom exercise | Yes  |
| GET    | `/api/exercises/:exerciseId` | Exercise detail        | Yes  |

## 5.5 Gyms (`g-01`)

| Method | Endpoint    | Description   | Auth |
| ------ | ----------- | ------------- | ---- |
| POST   | `/api/gyms` | Create gym    | Yes  |
| GET    | `/api/gyms` | List own gyms | Yes  |

## 5.6 Templates (`g-02`, `g-03`, `g-08`)

| Method | Endpoint                                   | Description               | Auth |
| ------ | ------------------------------------------ | ------------------------- | ---- |
| POST   | `/api/templates`                           | Create template           | Yes  |
| GET    | `/api/templates`                           | List own/shared templates | Yes  |
| GET    | `/api/templates/:templateId`               | Template detail           | Yes  |
| PATCH  | `/api/templates/:templateId`               | Update template meta      | Yes  |
| POST   | `/api/templates/:templateId/items`         | Add template item         | Yes  |
| PATCH  | `/api/templates/:templateId/items/:itemId` | Update template item      | Yes  |
| DELETE | `/api/templates/:templateId/items/:itemId` | Remove template item      | Yes  |
| GET    | `/api/templates/:templateId/versions`      | Version history           | Yes  |
| POST   | `/api/templates/:templateId/share`         | Share template to crew    | Yes  |

## 5.7 Workouts (`g-03`, `g-04`, `g-05`)

| Method | Endpoint                                 | Description                        | Auth |
| ------ | ---------------------------------------- | ---------------------------------- | ---- |
| POST   | `/api/workouts/start`                    | Start session from template/manual | Yes  |
| GET    | `/api/workouts/:sessionId`               | Session detail                     | Yes  |
| PATCH  | `/api/workouts/:sessionId`               | Update session meta/date           | Yes  |
| PATCH  | `/api/workouts/:sessionId/items/:itemId` | Replace/update session item        | Yes  |
| POST   | `/api/workouts/:sessionId/items`         | Add manual item                    | Yes  |
| POST   | `/api/workouts/:sessionId/sets`          | Add set                            | Yes  |
| PATCH  | `/api/workouts/:sessionId/sets/:setId`   | Edit set                           | Yes  |
| DELETE | `/api/workouts/:sessionId/sets/:setId`   | Delete set                         | Yes  |
| POST   | `/api/workouts/:sessionId/finish`        | Mark completed                     | Yes  |
| GET    | `/api/workouts/history`                  | Past sessions list                 | Yes  |

## 5.8 Progress (`g-04`, `g-11`, `g-12`, `g-13`)

### MVP

| Method | Endpoint                                                | Description         | Auth |
| ------ | ------------------------------------------------------- | ------------------- | ---- |
| GET    | `/api/progress/exercises/:exerciseId/last-best`         | Last + best summary | Yes  |
| GET    | `/api/progress/exercises/:exerciseId/charts/max-weight` | Max weight trend    | Yes  |
| GET    | `/api/progress/exercises/:exerciseId/charts/volume`     | Volume trend        | Yes  |

### Pro

| Method | Endpoint                                                  | Description           | Auth |
| ------ | --------------------------------------------------------- | --------------------- | ---- |
| GET    | `/api/progress/exercises/:exerciseId/charts/e1rm`         | e1RM trend            | Yes  |
| GET    | `/api/progress/muscles/:muscleGroup/charts/weekly-volume` | Weekly muscle volume  | Yes  |
| GET    | `/api/progress/adherence/weekly`                          | Weekly adherence      | Yes  |
| GET    | `/api/progress/exercises/:exerciseId/suggested-load`      | Suggested load by gym | Yes  |
| GET    | `/api/goals/training`                                     | Get weekly goal       | Yes  |
| PUT    | `/api/goals/training`                                     | Update weekly goal    | Yes  |

## 5.9 Social and Engagement (`g-06`~`g-10`, `g-16`)

| Method | Endpoint                                | Description                   | Auth |
| ------ | --------------------------------------- | ----------------------------- | ---- |
| POST   | `/api/checkins`                         | Create daily check-in         | Yes  |
| GET    | `/api/checkins`                         | List own check-ins            | Yes  |
| GET    | `/api/dashboard`                        | Dashboard summary             | Yes  |
| GET    | `/api/feed`                             | Friend activity feed          | Yes  |
| POST   | `/api/feed/:eventId/likes`              | Like feed event               | Yes  |
| DELETE | `/api/feed/:eventId/likes`              | Unlike feed event             | Yes  |
| GET    | `/api/users/:userId/profile`            | Profile data (privacy-scoped) | Yes  |
| POST   | `/api/friends/invite`                   | Send friend request           | Yes  |
| POST   | `/api/friends/:friendId/accept`         | Accept friend request         | Yes  |
| GET    | `/api/friends/:friendId/latest-workout` | Friend latest workout         | Yes  |
| POST   | `/api/crews`                            | Create crew                   | Yes  |
| GET    | `/api/crews`                            | List crews                    | Yes  |
| POST   | `/api/crews/:crewId/members`            | Add crew member               | Yes  |
| PUT    | `/api/privacy-settings`                 | Update privacy settings       | Yes  |
| GET    | `/api/reminders`                        | List reminders                | Yes  |
| PUT    | `/api/reminders/:reminderId`            | Update reminder               | Yes  |
| GET    | `/api/share-cards/templates`            | List share-card templates     | Yes  |
| POST   | `/api/share-cards/render`               | Render share card             | Yes  |
| GET    | `/api/leaderboards/friends/weekly`      | Friends weekly leaderboard    | Yes  |

## 5.10 Achievements (`g-15`)

| Method | Endpoint                     | Description          | Auth |
| ------ | ---------------------------- | -------------------- | ---- |
| GET    | `/api/achievements`          | List achievements    | Yes  |
| GET    | `/api/achievements/timeline` | Achievement timeline | Yes  |

## 5.11 Error Contract

| HTTP | Meaning                                          |
| ---- | ------------------------------------------------ |
| 400  | Validation error                                 |
| 401  | Not authenticated                                |
| 403  | Not authorized / plan required / privacy blocked |
| 404  | Resource not found                               |
| 409  | Version conflict / invalid transition            |
| 422  | Business rule failed                             |
| 429  | Rate limit                                       |

