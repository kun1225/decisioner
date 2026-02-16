# 4. Frontend Architecture

## 4.1 Routes

| Route | Purpose |
| --- | --- |
| `/` | Dashboard |
| `/templates` | Template list/create/edit |
| `/train/start` | Start workout from gym/template |
| `/train/$sessionId` | Workout editor (in-progress + history edit) |
| `/workouts/history` | Workout history list |
| `/progress` | Exercise progress charts |
| `/friends` | Friends management |
| `/crews` | Crew management |
| `/feed` | Friend activity feed |
| `/checkins` | Daily check-in list/streak |
| `/users/$userId` | Public profile |
| `/settings/privacy` | Privacy settings |
| `/settings/reminders` | Reminder settings |

## 4.2 Feature Boundaries

1. `features/auth`
2. `features/workouts`
3. `features/templates`
4. `features/progress`
5. `features/social`
6. `features/dashboard`
7. `features/settings`

## 4.3 Data Fetching

1. TanStack Query for server state
2. Route loader for route-level prefetch
3. Mutations invalidate corresponding query keys

## 4.4 Key Query Keys

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

## 4.5 UI Guards

1. Completed workout edit must show recompute warning
2. Privacy-restricted content must render explicit unavailable state
3. Free crew limits must display clear validation message
4. Pro-only share-card template must show upgrade prompt
