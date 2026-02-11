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

## 6.5 Chart Aggregation

1. Max Weight Chart
   x 軸：`session_date`
   y 軸：`max_weight`
   tooltip：`max_weight_reps`、`max_weight_set_index`

2. Volume Chart
   x 軸：`session_date`
   y 軸：`volume = sum(weight * reps)`

## 6.6 Privacy Guard

1. 所有朋友資料查詢先過 `privacy_settings`
2. 日期與訓練細節分開判斷
3. default 為 `FRIENDS`

## 6.7 Achievement Trigger

事件：

1. `WORKOUT_COMPLETED`
2. `PERSONAL_BEST_BROKEN`
3. `CREW_WORKOUT_COMPLETED`

規則：

1. 以 `achievement_definitions` 可配置 threshold
2. 發放寫入 `user_achievements`
3. 同條件發放需去重

## 6.8 S3 Upload Lifecycle

1. Client 取得 pre-signed URL
2. Client 直傳 S3
3. Client 呼叫完成 API 綁定 `exercise_media`
4. API 僅保存 `object_key` + `public_url`
