# 6. Core Mechanisms

## 6.1 Template Versioning (Append-only)

1. template 每次編輯建立 `template_versions`
2. `template_version_items` 保存完整快照
3. session 啟動時記錄 `template_version_id`

目的：

1. 支援多人協作與完整回溯
2. 避免「今天的 template 影響昨天訓練紀錄」

## 6.2 Session Snapshot Isolation

1. `POST /workouts/start` 會把 template items 複製成 `workout_session_items`
2. 訓練中替換或新增動作只修改 session items
3. template 不被當日變動污染

## 6.3 Past Workout Editing

需求：使用者可在歷史列表看到日期與 template，點進去編輯。

機制：

1. `GET /workouts/history` 提供歷史列表
2. 點擊後進入 `/train/$sessionId`，載入 `GET /workouts/:sessionId`
3. 若 session 狀態為 `COMPLETED`：
   - 允許編輯 set/item
   - 編輯後建立 `workout_session_revisions`
   - 重算 `exercise_session_metrics`
   - 成就判斷重新同步（去重）

## 6.4 Last / Best Computation

### Last

1. 同使用者、同動作、最近一次完成 session

### Best

1. 比較 `max_weight` 最大者
2. 若同重，選 `reps` 較高
3. 若再同，選較新時間

## 6.5 Exercise Metric Computation

在 session 完成（或完成後被編輯）時，按每個 exercise 重算：

1. `max_weight`
2. `max_weight_reps`
3. `max_weight_set_index`
4. `volume = sum(weight * reps)`

## 6.6 Chart Aggregation

1. Max Weight Chart
   - x 軸：`session_date`
   - y 軸：`max_weight`
   - tooltip：`max_weight_reps`、`max_weight_set_index`
2. Volume Chart
   - x 軸：`session_date`
   - y 軸：`volume`

## 6.7 Pro Analytics Add-ons (Paid)

1. e1RM Chart
   - 每組先算 `set_e1rm = weight * (1 + reps / 30)`（Epley）
   - 取該 exercise 在該 session 的最大 `set_e1rm` 作為 `estimated_1rm`
   - 若 e1RM 相同，依序取 `reps` 較高、`set_index` 較前、`created_at` 較新
2. Weekly Muscle Volume Chart
   - x 軸：`week_start`
   - y 軸：`sum(weight * reps)`（按 muscle group 聚合）
   - 預設只算 `primary_muscle_group`
3. Subjective Load Capture
   - 每組 set 可選填 `rpe`、`rir`
   - `rpe` 與 `rir` 皆可同時存在
4. Weekly Adherence
   - 以週為單位計算 `completed_sessions / weekly_workout_target`
   - `completed_sessions` 只計 `session_status = COMPLETED`
   - 目標值來源：`user_training_goals.weekly_workout_target`
   - mode 預設 `WEEKLY_TARGET`，保留 `TEMPLATE_SCHEDULE` 擴充點
5. Simple Auto-conversion
   - 以 `user + gym + exercise` 維度保存簡單調整係數（`adjustment_ratio`）
   - 第一次在新 gym 訓練時，先顯示其他 gym 的最近紀錄
   - 使用者啟用「記住此 gym 差異」後更新該維度調整係數
   - 不做器材層級換算，不提供複雜公式編輯

## 6.8 Free-Lite Social Limits

1. 每位使用者最多建立 1 個 crew
2. 每個 crew 最多 2 位成員（owner + 1）
3. 超限時 API 回傳 `422` + `FREE_TIER_LIMIT_EXCEEDED`

## 6.9 Privacy Guard

1. 所有朋友資料查詢先過 `privacy_settings`
2. 日期與訓練細節分開判斷
3. default 為 `FRIENDS`

## 6.10 Achievement Trigger

事件：

1. `WORKOUT_COMPLETED`
2. `PERSONAL_BEST_BROKEN`
3. `CREW_WORKOUT_COMPLETED`

規則：

1. 以 `achievement_definitions` 可配置 threshold
2. 發放寫入 `user_achievements`
3. 同條件發放需去重

## 6.11 S3 Upload Lifecycle

1. Client 取得 pre-signed URL
2. Client 直傳 S3
3. Client 呼叫完成 API 綁定 `exercise_media`
4. API 僅保存 `object_key` + `public_url`
