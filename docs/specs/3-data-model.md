# 3. Data Model

## 3.1 Entity Relationship Diagram (UML-style)

```text
┌──────────────────────────────────────────────┐
│                    users                     │
├──────────────────────────────────────────────┤
│ id (uuid, PK)                                │
│ email (unique)                               │
│ name                                          │
│ auth_provider                                 │
│ hashed_password                               │
│ google_sub                                    │
│ avatar_url                                    │
│ created_at                                    │
└──────────────────────────────────────────────┘
           │1
           │
           ├───────────────┬──────────────────┬───────────────────┬──────────────────┐
           │N              │N                 │N                  │N                 │N
           ▼               ▼                  ▼                   ▼                  ▼
┌──────────────────┐ ┌─────────────────┐ ┌────────────────┐ ┌─────────────────┐ ┌────────────────────┐
│      gyms        │ │    exercises    │ │   templates    │ │ workout_sessions │ │  privacy_settings  │
├──────────────────┤ ├─────────────────┤ ├────────────────┤ ├─────────────────┤ ├────────────────────┤
│ id (PK)          │ │ id (PK)         │ │ id (PK)        │ │ id (PK)         │ │ id (PK)            │
│ user_id (FK)     │ │ owner_id (FK?)  │ │ owner_id (FK)  │ │ user_id (FK)     │ │ user_id (FK, uniq) │
│ name             │ │ source enum      │ │ name            │ │ gym_id (FK)      │ │ show_workout_date  │
│ created_at       │ │ name             │ │ description     │ │ template_id (FK?) │ │ show_workout_records│
└──────────────────┘ │ image_url        │ │ created_at       │ │ template_version_id│ │ created_at         │
                     │ deleted_at       │ └────────────────┘ │ status enum       │ └────────────────────┘
                     └─────────────────┘          │1         │ session_date      │
                           │1                     │          │ last_edited_at    │
                           │                      │N         │ completed_at      │
                           │N                     ▼          └─────────────────┘
                     ┌─────────────────┐   ┌──────────────────┐         │1
                     │ exercise_media  │   │  template_items  │         │
                     ├─────────────────┤   ├──────────────────┤         │N
                     │ id (PK)         │   │ id (PK)          │         ▼
                     │ exercise_id (FK)│   │ template_id (FK) │  ┌──────────────────────┐
                     │ object_key      │   │ exercise_id (FK) │  │ workout_session_items │
                     │ status enum      │   │ sort_order        │  ├──────────────────────┤
                     │ created_at       │   │ note              │  │ id (PK)               │
                     └─────────────────┘   └──────────────────┘  │ session_id (FK)        │
                                                                  │ exercise_id (FK)       │
                                                                  │ origin_type enum       │
                                                                  │ sort_order             │
                                                                  └──────────────────────┘
                                                                             │1
                                                                             │N
                                                                             ▼
                                                                  ┌──────────────────────┐
                                                                  │     workout_sets     │
                                                                  ├──────────────────────┤
                                                                  │ id (PK)               │
                                                                  │ session_item_id (FK)  │
                                                                  │ set_index             │
                                                                  │ weight                │
                                                                  │ reps                  │
                                                                  │ unit                  │
                                                                  │ created_at            │
                                                                  └──────────────────────┘

┌──────────────────────┐     1      ┌──────────────────────┐     1      ┌────────────────────────┐
│      templates       │────────────│  template_versions   │────────────│ template_version_items │
└──────────────────────┘     N      ├──────────────────────┤     N      ├────────────────────────┤
                                    │ id (PK)               │            │ id (PK)                 │
                                    │ template_id (FK)       │            │ template_version_id (FK)│
                                    │ version_no             │            │ exercise_id (FK)        │
                                    │ edited_by (FK -> users)│            │ sort_order              │
                                    │ snapshot_json          │            │ note                    │
                                    │ created_at             │            └────────────────────────┘

┌──────────────────────────┐      N:1      ┌──────────────────┐
│ workout_session_revisions│───────────────│ workout_sessions │
├──────────────────────────┤                └──────────────────┘
│ id (PK)                  │
│ session_id (FK)          │
│ revision_no              │
│ edited_by (FK -> users)  │
│ reason                   │
│ snapshot_json            │
│ created_at               │
└──────────────────────────┘

┌──────────────────────────┐      N:1      ┌─────────────────┐      N:1      ┌──────────────────────┐
│ exercise_session_metrics │───────────────│      users      │───────────────│      exercises       │
├──────────────────────────┤               └─────────────────┘               └──────────────────────┘
│ id (PK)                  │
│ user_id (FK)             │
│ exercise_id (FK)         │
│ session_id (FK)          │
│ session_date             │
│ max_weight               │
│ max_weight_reps          │
│ max_weight_set_index     │
│ volume                   │
│ created_at               │
└──────────────────────────┘

┌──────────────────┐     N:M     ┌──────────────────┐
│      users       │─────────────│      friends     │
└──────────────────┘             ├──────────────────┤
                                 │ id (PK)          │
                                 │ user_id (FK)     │
                                 │ friend_user_id(FK)│
                                 │ status enum      │
                                 │ created_at       │
                                 └──────────────────┘

┌──────────────────┐    1:N    ┌──────────────────┐    N:1    ┌──────────────────┐
│      crews       │───────────│   crew_members   │───────────│      users       │
├──────────────────┤           ├──────────────────┤           └──────────────────┘
│ id (PK)          │           │ id (PK)          │
│ owner_id (FK)    │           │ user_id (FK)     │
│ name             │           │ role enum        │
│ created_at       │           │ joined_at        │
└──────────────────┘           └──────────────────┘

┌──────────────────────┐   N:1   ┌──────────────────┐
│   template_shares    │─────────│    templates     │
├──────────────────────┤         └──────────────────┘
│ id (PK)              │
│ template_id (FK)     │
│ crew_id (FK)         │
│ shared_by (FK->users)│
│ created_at           │
└──────────────────────┘

┌──────────────────────────┐     1:N     ┌─────────────────────┐
│ achievement_definitions  │─────────────│  user_achievements  │
├──────────────────────────┤             ├─────────────────────┤
│ id (PK)                  │             │ id (PK)             │
│ code (unique)            │             │ user_id (FK)        │
│ rule_type                │             │ definition_id (FK)  │
│ threshold                │             │ unlocked_at         │
│ metadata_json            │             └─────────────────────┘
└──────────────────────────┘
             │1
             │N
             ▼
┌──────────────────────────┐
│    achievement_events    │
├──────────────────────────┤
│ id (PK)                  │
│ user_id (FK)             │
│ event_type               │
│ ref_session_id (FK?)     │
│ payload_json             │
│ created_at               │
└──────────────────────────┘
```

---

## 3.1.1 Pro Analytics Extensions (Paid)

> 完整欄位定義請參閱 **[12-pro-features.md](./12-pro-features.md)**

涉及資料表：

1. `exercises` (muscle groups)
2. `workout_sets` (rpe/rir)
3. `exercise_session_metrics` (estimated_1rm)
4. `user_training_goals`
5. `user_gym_exercise_adjustments`

## 3.1.2 Social Growth Extensions

以下欄位為本次新增功能所需資料模型，既有 gym-aware 與圖表模型維持不變：

1. `workout_checkins`
   - `id`（PK）
   - `user_id`（FK -> users）
   - `session_id`（FK -> workout_sessions, nullable）
   - `checkin_date`（date, indexed）
   - `note`（varchar, nullable）
   - `streak_count`（int）
   - `created_at`
2. `activity_feed_events`
   - `id`（PK）
   - `actor_user_id`（FK -> users）
   - `event_type`（enum）
   - `ref_session_id`（FK -> workout_sessions, nullable）
   - `ref_checkin_id`（FK -> workout_checkins, nullable）
   - `visibility_level`（enum）
   - `created_at`
3. `activity_likes`
   - `id`（PK）
   - `event_id`（FK -> activity_feed_events）
   - `user_id`（FK -> users）
   - `created_at`
4. `reminder_settings`
   - `id`（PK）
   - `user_id`（FK -> users）
   - `reminder_type`（enum）
   - `schedule_type`（enum）
   - `time_of_day`（varchar, HH:mm）
   - `weekdays`（array/json, nullable）
   - `timezone`（varchar）
   - `enabled`（boolean）
   - `created_at`, `updated_at`
5. `share_card_templates`（system）
   - `id`（PK）
   - `code`（unique）
   - `tier`（enum: FREE|PRO）
   - `name`
   - `is_active`
6. `share_card_renders`
   - `id`（PK）
   - `user_id`（FK -> users）
   - `template_id`（FK -> share_card_templates）
   - `ref_type`（enum: CHECKIN|SESSION）
   - `ref_id`（uuid）
   - `image_url`
   - `created_at`

---

## 3.2 Table Groups

### Identity

1. `users`
2. `refresh_tokens`

### Workout Core (MVP Free)

1. `gyms`
2. `exercises`
3. `exercise_media`
4. `templates`
5. `template_items`
6. `template_versions`
7. `template_version_items`
8. `workout_sessions`
9. `workout_session_items`
10. `workout_sets`
11. `workout_session_revisions`
12. `exercise_session_metrics`

### Pro Analytics (Paid)

1. `user_training_goals`
2. `user_gym_exercise_adjustments`

### Engagement / Social Growth

1. `workout_checkins`
2. `activity_feed_events`
3. `activity_likes`
4. `reminder_settings`
5. `share_card_templates`
6. `share_card_renders`

### Social / Privacy

1. `friends`
2. `crews`
3. `crew_members`
4. `template_shares`
5. `privacy_settings`

### Achievement

1. `achievement_definitions`
2. `achievement_events`
3. `user_achievements`

---

## 3.3 Key Constraints

1. `friends(user_id, friend_user_id)` unique
2. `privacy_settings.user_id` unique（每人一筆）
3. `template_versions(template_id, version_no)` unique
4. `workout_session_revisions(session_id, revision_no)` unique
5. `exercise_session_metrics` 需可追溯到 `session_id`
6. completed session 可編輯，但必須寫 revision
7. `user_training_goals.user_id` unique（每人一筆, Pro）
8. 免費版社交限制由服務層控管：
   - 每位使用者最多建立 1 個 `crew`
   - 每個 `crew` 最多 2 位成員
9. `user_gym_exercise_adjustments(user_id, gym_id, exercise_id)` unique（Pro）
10. `workout_checkins(user_id, checkin_date)` unique（每日最多一筆打卡）
11. `activity_likes(event_id, user_id)` unique（每人對同事件最多一個 like）
12. `reminder_settings(user_id, reminder_type)` unique

---

## 3.4 Suggested Indexes

1. `workout_sessions(user_id, session_date desc)`
2. `workout_sessions(user_id, status, session_date desc)`
3. `workout_sets(session_item_id, set_index)`
4. `workout_session_revisions(session_id, revision_no desc)`
5. `exercise_session_metrics(user_id, exercise_id, session_date desc)`
6. `exercise_session_metrics(user_id, exercise_id, max_weight desc)`
7. `template_versions(template_id, version_no desc)`
8. `workout_session_items(exercise_id)`
9. `exercises(primary_muscle_group)`（Pro）
10. `exercise_session_metrics(user_id, exercise_id, estimated_1rm desc)`（Pro）
11. `user_gym_exercise_adjustments(user_id, gym_id, exercise_id)`（Pro）
12. `workout_checkins(user_id, checkin_date desc)`
13. `activity_feed_events(actor_user_id, created_at desc)`
14. `activity_feed_events(created_at desc)`
15. `activity_likes(event_id)`
16. `share_card_renders(user_id, created_at desc)`

---

## 3.5 Enums

1. `exercise_source`: `PRESET | CUSTOM`
2. `session_status`: `IN_PROGRESS | COMPLETED`
3. `session_item_origin`: `TEMPLATE | REPLACED | MANUAL`
4. `friend_status`: `PENDING | ACCEPTED | BLOCKED`
5. `crew_role`: `OWNER | MEMBER`
6. `visibility_level`: `PRIVATE | FRIENDS | PUBLIC`
7. `media_status`: `UPLOADING | READY | FAILED`
8. `muscle_group`: `CHEST | BACK | SHOULDERS | BICEPS | TRICEPS | QUADS | HAMSTRINGS | GLUTES | CALVES | CORE`（Pro）
9. `adherence_mode`: `WEEKLY_TARGET | TEMPLATE_SCHEDULE`（Pro）
10. `activity_event_type`: `WORKOUT_STARTED | WORKOUT_COMPLETED | CHECKIN_CREATED | ACHIEVEMENT_UNLOCKED`
11. `reminder_type`: `WORKOUT_CHECKIN | WORKOUT_PLAN`
12. `reminder_schedule_type`: `DAILY | WEEKLY`

---

## 3.6 Product-critical Query Contracts

### Workout History List

輸入：`user_id` + pagination
輸出：`session_id`, `session_date`, `template_name`, `status`, `last_edited_at`

### Last / Best Summary

輸入：`user_id` + `exercise_id` + optional `gym_id`
輸出：上次紀錄 + 最佳紀錄（`max_weight`, `max_weight_reps`, `max_weight_set_index`）

### Dashboard Summary

輸入：`user_id` + optional week range
輸出：`weekly_workout_count`, `current_streak`, `last_checkin_date`, `recent_feed_events`

### Friend Feed

輸入：`user_id` + pagination
輸出：`event_id`, `actor`, `event_type`, `summary`, `liked_by_me`, `like_count`, `created_at`

### Public Profile View

輸入：`viewer_user_id` + `target_user_id`
輸出：受隱私設定裁切後的 `profile_basic`, `recent_workouts`, `dashboard_summary`

### Pro Queries

> e1RM Trend, Weekly Muscle Volume, Weekly Adherence, Suggested Load 皆為 Pro 查詢契約，詳見 **[12-pro-features.md](./12-pro-features.md)**
