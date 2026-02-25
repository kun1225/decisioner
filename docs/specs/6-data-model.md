# 6. Data Contract

## 6.1 Relationship Overview

```text
users
├─ gyms
├─ workout_sessions ─ workout_session_items ─ workout_sets
├─ templates ─ template_items
│  └─ template_versions ─ template_version_items
├─ workout_checkins
├─ activity_feed_events ─ activity_likes
├─ privacy_settings
├─ friends
├─ crews ─ crew_members
└─ user_achievements

workout_sessions -> exercise_session_metrics
workout_sessions -> workout_session_revisions
templates -> template_shares
```

## 6.2 Table Catalog

### Identity

1. `users`
2. `refresh_tokens`

### Workout Core

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

### Social / Privacy / Engagement

1. `friends`
2. `crews`
3. `crew_members`
4. `template_shares`
5. `privacy_settings`
6. `workout_checkins`
7. `activity_feed_events`
8. `activity_likes`
9. `reminder_settings`
10. `share_card_templates`
11. `share_card_renders`

### Achievement

1. `achievement_definitions`
2. `achievement_events`
3. `user_achievements`

### Pro Analytics

1. `user_training_goals`
2. `user_gym_exercise_adjustments`

## 6.3 Key Constraints

1. `friends(user_id, friend_user_id)` unique
2. `privacy_settings.user_id` unique
3. `template_versions(template_id, version_no)` unique
4. `workout_session_revisions(session_id, revision_no)` unique
5. `workout_checkins(user_id, checkin_date)` unique
6. `activity_likes(event_id, user_id)` unique
7. `reminder_settings(user_id, reminder_type)` unique
8. `user_training_goals.user_id` unique (Pro)
9. `user_gym_exercise_adjustments(user_id, gym_id, exercise_id)` unique (Pro)

## 6.4 Suggested Indexes

1. `workout_sessions(user_id, session_date desc)`
2. `workout_sessions(user_id, status, session_date desc)`
3. `workout_sets(session_item_id, set_index)`
4. `workout_session_revisions(session_id, revision_no desc)`
5. `exercise_session_metrics(user_id, exercise_id, session_date desc)`
6. `exercise_session_metrics(user_id, exercise_id, max_weight desc)`
7. `template_versions(template_id, version_no desc)`
8. `workout_session_items(exercise_id)`
9. `workout_checkins(user_id, checkin_date desc)`
10. `activity_feed_events(actor_user_id, created_at desc)`
11. `activity_feed_events(created_at desc)`
12. `activity_likes(event_id)`
13. `share_card_renders(user_id, created_at desc)`
14. `user_gym_exercise_adjustments(user_id, gym_id, exercise_id)` (Pro)

## 6.5 Enums

1. `exercise_source`: `PRESET | CUSTOM`
2. `session_status`: `IN_PROGRESS | COMPLETED`
3. `session_item_origin`: `TEMPLATE | REPLACED | MANUAL`
4. `friend_status`: `PENDING | ACCEPTED | BLOCKED`
5. `crew_role`: `OWNER | MEMBER`
6. `visibility_level`: `PRIVATE | FRIENDS | PUBLIC`
7. `media_status`: `UPLOADING | READY | FAILED`
8. `activity_event_type`: `WORKOUT_STARTED | WORKOUT_COMPLETED | CHECKIN_CREATED | ACHIEVEMENT_UNLOCKED`
9. `reminder_type`: `WORKOUT_CHECKIN | WORKOUT_PLAN`
10. `reminder_schedule_type`: `DAILY | WEEKLY`
11. `muscle_group`: `CHEST | BACK | SHOULDERS | BICEPS | TRICEPS | QUADS | HAMSTRINGS | GLUTES | CALVES | CORE` (Pro)
12. `adherence_mode`: `WEEKLY_TARGET | TEMPLATE_SCHEDULE` (Pro)

## 6.6 Query Contracts

1. Workout history list: `session_id`, `session_date`, `template_name`, `status`, `last_edited_at`
2. Last/best summary: last record + best record (`max_weight`, `reps`, `set_index`)
3. Dashboard summary: `weekly_workout_count`, `current_streak`, `last_checkin_date`, `recent_feed_events`
4. Friend feed: `event_id`, `actor`, `event_type`, `liked_by_me`, `like_count`, `created_at`
5. Public profile view: privacy-filtered `profile_basic`, `recent_workouts`, `dashboard_summary`
6. Pro suggested load: `last_in_this_gym`, `last_in_other_gyms`, `suggested_weight`

## 6.7 Goal Reference Map

- `g-01`: `gyms`, `workout_sessions(gym_id)`
- `g-02`: `templates`, `template_items`, `template_versions`, `template_version_items`, `exercise_media`
- `g-03`: `workout_sessions`, `workout_session_items`, `workout_sets`
- `g-04`: `exercise_session_metrics`
- `g-05`: `workout_session_revisions`, `exercise_session_metrics`
- `g-06`: `workout_checkins`, `workout_sessions`
- `g-07`: `activity_feed_events`, `activity_likes`
- `g-08`: `privacy_settings`, `friends`, `crews`, `crew_members`, `template_shares`
- `g-09`: `reminder_settings`
- `g-10`: `share_card_templates`, `share_card_renders`
- `g-11`: `exercise_session_metrics`
- `g-12`: `exercise_session_metrics(estimated_1rm)`, `workout_sets(rpe/rir)`, `user_training_goals`
- `g-13`: `user_gym_exercise_adjustments`
- `g-14`: `achievement_events` (future `weekly_challenges` table)
- `g-15`: `achievement_definitions`, `achievement_events`, `user_achievements`
- `g-16`: `friends` + leaderboard projection store (future)
- `g-17`: `users` + profile customization store (future)
- `g-18`: `users`, `refresh_tokens`
