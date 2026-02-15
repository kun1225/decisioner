# 6. Core Mechanisms & State Machines

## 6.1 State Machines

### 6.1.1 Workout Session State

```text
IN_PROGRESS --finish--> COMPLETED
COMPLETED --edit--> COMPLETED
```

**Transition Rules:**

| Current     | Action                     | Next        | Notes                       |
| ----------- | -------------------------- | ----------- | --------------------------- |
| IN_PROGRESS | Add/Edit/Delete sets/items | IN_PROGRESS | 即時編輯                    |
| IN_PROGRESS | Finish session             | COMPLETED   | 產生 metrics / achievements |
| COMPLETED   | Edit past session          | COMPLETED   | 建立 revision + 重新計算    |

**Constraints:**

1. `COMPLETED` 不回到 `IN_PROGRESS`
2. past edit 必須記錄 revision（避免 silent overwrite）
3. past edit 後需重算 progress 與成就事件

### 6.1.2 Friend Request State

```text
PENDING --accept--> ACCEPTED
PENDING --block--> BLOCKED
ACCEPTED --block--> BLOCKED
```

| Current  | Action | Next     |
| -------- | ------ | -------- |
| PENDING  | Accept | ACCEPTED |
| PENDING  | Block  | BLOCKED  |
| ACCEPTED | Block  | BLOCKED  |

### 6.1.3 Template Lifecycle

```text
ACTIVE --archive--> ARCHIVED
ARCHIVED --restore--> ACTIVE
```

1. template item 可編輯，但每次變更都要產生新 version
2. shared template 由 crew member 編輯時也套用相同版本規則

### 6.1.4 Check-in State (MVP)

```text
NONE --create checkin--> CHECKED_IN
CHECKED_IN --next day--> NONE
```

| Current    | Action         | Next       | Notes                            |
| ---------- | -------------- | ---------- | -------------------------------- |
| NONE       | Create checkin | CHECKED_IN | 同日首次打卡成功                 |
| CHECKED_IN | Create checkin | CHECKED_IN | 同日重複請求不新增（idempotent） |
| CHECKED_IN | Day rollover   | NONE       | 進入新的一天                     |

---

## 6.2 Template Versioning (Append-only)

1. template 每次編輯建立 `template_versions`
2. `template_version_items` 保存完整快照
3. session 啟動時記錄 `template_version_id`

目的：

1. 支援多人協作與完整回溯
2. 避免「今天的 template 影響昨天訓練紀錄」

## 6.3 Session Snapshot Isolation

1. `POST /workouts/start` 會把 template items 複製成 `workout_session_items`
2. 訓練中替換或新增動作只修改 session items
3. template 不被當日變動污染

## 6.4 Past Workout Editing

需求：使用者可在歷史列表看到日期與 template，點進去編輯。

機制：

1. `GET /workouts/history` 提供歷史列表
2. 點擊後進入 `/train/$sessionId`，載入 `GET /workouts/:sessionId`
3. 若 session 狀態為 `COMPLETED`：
   - 允許編輯 set/item
   - 編輯後建立 `workout_session_revisions`
   - 重算 `exercise_session_metrics`
   - 成就判斷重新同步（去重）

## 6.5 Last / Best Computation

### Last

1. 同使用者、同動作、最近一次完成 session

### Best

1. 比較 `max_weight` 最大者
2. 若同重，選 `reps` 較高
3. 若再同，選較新時間

## 6.6 Exercise Metric Computation

在 session 完成（或完成後被編輯）時，按每個 exercise 重算：

1. `max_weight`
2. `max_weight_reps`
3. `max_weight_set_index`
4. `volume = sum(weight * reps)`

## 6.7 Chart Aggregation

1. Max Weight Chart
   - x 軸：`session_date`
   - y 軸：`max_weight`
   - tooltip：`max_weight_reps`、`max_weight_set_index`
2. Volume Chart
   - x 軸：`session_date`
   - y 軸：`volume`

## 6.8 Pro Analytics (Paid)

> 詳細付費功能邏輯請參閱 **[12-pro-features.md](./12-pro-features.md)**

涵蓋範圍：

1. e1RM Chart
2. Weekly Muscle Volume Chart
3. Subjective Load Capture (RPE/RIR)
4. Weekly Adherence
5. Simple Auto-conversion

## 6.9 Free-Lite Social Limits

1. 每位使用者最多建立 1 個 crew
2. 每個 crew 最多 2 位成員（owner + 1）
3. 超限時 API 回傳 `422` + `FREE_TIER_LIMIT_EXCEEDED`

## 6.10 Privacy Guard

1. 所有朋友資料查詢先過 `privacy_settings`
2. 日期與訓練細節分開判斷
3. default 為 `FRIENDS`

## 6.11 Achievement Trigger

事件：

1. `WORKOUT_COMPLETED`
2. `PERSONAL_BEST_BROKEN`
3. `CREW_WORKOUT_COMPLETED`

規則：

1. 以 `achievement_definitions` 可配置 threshold
2. 發放寫入 `user_achievements`
3. 同條件發放需去重

## 6.12 S3 Upload Lifecycle

1. Client 取得 pre-signed URL
2. Client 直傳 S3
3. Client 呼叫完成 API 綁定 `exercise_media`
4. API 僅保存 `object_key` + `public_url`

## 6.13 Check-in and Streak Computation (MVP)

1. `POST /api/checkins` 建立當日打卡（可選擇綁定 `session_id`）
2. 每位使用者每天僅允許一筆打卡，重複建立採 upsert
3. `streak_count` 計算規則：
   - 若 `checkin_date = last_checkin_date + 1 day`，streak +1
   - 若相同日期，維持原 streak
   - 否則重置為 1
4. Dashboard 從 `workout_checkins` + `workout_sessions` 聚合

## 6.14 Friend Feed Event Pipeline (MVP)

事件來源：

1. `WORKOUT_STARTED`
2. `WORKOUT_COMPLETED`
3. `CHECKIN_CREATED`

規則：

1. 寫入 `activity_feed_events` 時即保存 `visibility_level`
2. 讀取 feed 前再經過 `privacy guard` 二次過濾
3. 支援 cursor-based pagination（`created_at`, `id`）

## 6.15 Like Deduplication (MVP)

1. `activity_likes(event_id, user_id)` unique，避免重複按愛心
2. 取消愛心採 hard delete 即可
3. like 計數由聚合查詢或快取維護

## 6.16 Reminder Scheduler (MVP)

1. `reminder_settings` 由使用者維護提醒規則（時區 + 時間）
2. 排程器依 `enabled=true` + `timezone` 產生下一次觸發時間
3. 提醒發送失敗需記錄重試，避免重複發送

## 6.17 Share Card Rendering and Plan Guard (MVP)

1. 分享卡渲染流程：載入模板 -> 套資料 -> 輸出圖片 URL
2. 模板依 `share_card_templates.tier` 做方案授權檢查
3. 免費版僅允許 `FREE` 模板；Pro 可用 `FREE + PRO`
4. 不符合權限時回傳 `403 PLAN_REQUIRED`
