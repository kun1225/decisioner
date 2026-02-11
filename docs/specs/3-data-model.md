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
                                                                  │ gym_equipment_id (FK?) │
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
                                    └──────────────────────┘

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
│ owner_id (FK)    │           │ crew_id (FK)     │
│ name             │           │ user_id (FK)     │
│ created_at       │           │ role enum        │
└──────────────────┘           │ joined_at        │
                               └──────────────────┘

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

## 3.2 Table Groups

### Identity

1. `users`
2. `refresh_tokens`

### Workout Core

1. `gyms`
2. `gym_equipments`
3. `exercises`
4. `exercise_media`
5. `templates`
6. `template_items`
7. `template_versions`
8. `template_version_items`
9. `workout_sessions`
10. `workout_session_items`
11. `workout_sets`
12. `workout_session_revisions`
13. `exercise_session_metrics`

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

---

## 3.4 Suggested Indexes

1. `workout_sessions(user_id, session_date desc)`
2. `workout_sessions(user_id, status, session_date desc)`
3. `workout_sets(session_item_id, set_index)`
4. `workout_session_revisions(session_id, revision_no desc)`
5. `exercise_session_metrics(user_id, exercise_id, session_date desc)`
6. `exercise_session_metrics(user_id, exercise_id, max_weight desc)`
7. `template_versions(template_id, version_no desc)`

---

## 3.5 Enums

1. `exercise_source`: `PRESET | CUSTOM`
2. `session_status`: `IN_PROGRESS | COMPLETED`
3. `session_item_origin`: `TEMPLATE | REPLACED | MANUAL`
4. `friend_status`: `PENDING | ACCEPTED | BLOCKED`
5. `crew_role`: `OWNER | MEMBER`
6. `visibility_level`: `PRIVATE | FRIENDS | PUBLIC`
7. `media_status`: `UPLOADING | READY | FAILED`

---

## 3.6 Product-critical Query Contracts

### Workout History List

輸入：`user_id` + pagination
輸出：`session_id`, `session_date`, `template_name`, `status`, `last_edited_at`

### Last / Best Summary

輸入：`user_id` + `exercise_id` + optional `gym_id`
輸出：上次紀錄 + 最佳紀錄（`max_weight`, `max_weight_reps`, `max_weight_set_index`）
