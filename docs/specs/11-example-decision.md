# 11. Example Workout

## User Story

使用者在 2026-02-08 做胸部訓練，採用 `Chest A` template，地點為 `Downtown Gym`。

## Session Timeline

1. 建立 session：`IN_PROGRESS`
2. 原課表第一動作：Barbell Bench Press
3. 因器材占用改成 Dumbbell Bench Press（`origin_type = REPLACED`）
4. 完成訓練後 `finish` -> `COMPLETED`
5. 系統計算該動作：
   - `max_weight = 36kg`
   - `max_weight_reps = 8`
   - `volume = 1080`

## Historical Edit Example

1. 2026-02-10 使用者發現第二組重量記錯
2. 進入 `/workouts/history`，點擊 2026-02-08 的紀錄
3. 在 `/train/$sessionId` 修正 set weight：`34kg -> 32kg`
4. 儲存後：
   - session 狀態仍為 `COMPLETED`
   - 新增一筆 `workout_session_revisions`
   - 重新計算 metrics 與相關成就

## Expected Outcome

1. 歷史資料可回補修正
2. 修正行為可追溯
3. 圖表與最佳紀錄反映最新正確數據
