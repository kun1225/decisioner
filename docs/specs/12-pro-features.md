# 12. Pro Features (Paid)

> **Status:** Draft
> **Related Specs:** 3-data-model, 4-api-design, 6-core-mechanisms, 10-ux-flows

本文件彙整所有 JoyGym 付費版（Pro）之專屬功能、資料模型擴充與計算邏輯。MVP 免費版實作時請略過此文件內容。

## 12.1 Feature Overview

| Feature                   | Description                                             | MVP (Free) Status |
| :------------------------ | :------------------------------------------------------ | :---------------- |
| **Advanced Analytics**    | e1RM, Weekly Muscle Volume, Adherence, RPE/RIR analysis | 僅顯示升級引導    |
| **Suggested Load**        | 針對不同健身房提供簡單重量換算建議                      | 不提供            |
| **Share Card Templates**  | 進階設計感分享卡片                                      | 僅限基礎模板      |
| **Profile Customization** | 自訂個人頁主題與配置 (MVP 3)                            | 僅標準樣式        |

## 12.2 Data Model Extensions

以下欄位僅於 Pro 功能啟用時收集或展示（參考 `3-data-model.md`）：

### 12.2.1 Exercises

- `primary_muscle_group` (enum, required): `CHEST`, `BACK`, `SHOULDERS`, `BICEPS`, `TRICEPS`, `QUADS`, `HAMSTRINGS`, `GLUTES`, `CALVES`, `CORE`
- `secondary_muscle_groups` (array/json, optional)

### 12.2.2 Workout Sets

- `rpe` (numeric, nullable): 1.0 ~ 10.0
- `rir` (smallint, nullable): 0 ~ 5

### 12.2.3 Exercise Session Metrics

- `estimated_1rm` (numeric): 由該 session 每個 exercise 的最佳組推導 (Epley formula)

### 12.2.4 User Training Goals

- `user_id` (FK -> users, unique)
- `adherence_mode` (enum): `WEEKLY_TARGET` (default), `TEMPLATE_SCHEDULE`
- `weekly_workout_target` (int, default 3)

### 12.2.5 Gym Adjustments

- `user_gym_exercise_adjustments(user_id, gym_id, exercise_id)`: 用於儲存 `adjustment_ratio`

## 12.3 Core Logic & Computation

### 12.3.1 e1RM Calculation (Epley)

- 公式：`set_e1rm = weight * (1 + reps / 30)`
- 聚合：取該 exercise 在該 session 的最大 `set_e1rm`
- 排序：若 e1RM 相同，依序取 `reps` 較高 -> `set_index` 較前 -> `created_at` 較新

### 12.3.2 Weekly Muscle Volume

- x 軸：`week_start`
- y 軸：`sum(weight * reps)`
- 分組：按 `muscle_group` 聚合
- 選項：預設只計算 `primary_muscle_group`，可選 `includeSecondary`

### 12.3.3 Suggested Load (Simple Auto-conversion)

- 目的：解決不同健身房器材力學差異導致的重量落差
- 邏輯：
  1. 系統維護 `user + gym + exercise` 維度的 `adjustment_ratio`
  2. 當使用者在新 gym 訓練某動作時，系統撈取其他 gym 的最近紀錄
  3. 使用者可手動啟用「記住此 gym 差異」，更新 `adjustment_ratio`
- 限制：
  - 不支援器材層級 (Gym Equipment) 管理
  - 不提供自訂公式編輯

### 12.3.4 Weekly Adherence

- 分子：`completed_sessions` (本週 `COMPLETED` 的 session 數)
- 分母：`user_training_goals.weekly_workout_target`
- 輸出：`adherence_rate` (0.0 ~ 1.0+)

## 12.4 UX Flows (Pro Scenarios)

### Scenario H: Pro 進階分析

1. 使用者升級後可使用 e1RM / 肌群週訓練量 / adherence
2. 使用者可在 set 記錄 `RPE`、`RIR`
3. 使用者可設定每週訓練目標次數（adherence）
4. 使用者在新 gym 訓練某動作時，系統提供簡單建議重量（suggested load）
5. 使用者可開啟「記住此 gym 差異」以更新後續自動換算

### Scenario K: 分享卡片 (Pro)

1. 使用者完成訓練或打卡後點擊「分享」
2. 系統列出模板列表 (`GET /api/share-cards/templates`)
3. Pro 使用者可選擇標記為 `PRO` 的進階模板
4. 渲染後產生高品質圖片供社群分享

## 12.5 API Endpoints (Pro Only)

| Method | Endpoint                                                  | Description                    |
| :----- | :-------------------------------------------------------- | :----------------------------- |
| GET    | `/api/progress/exercises/:exerciseId/charts/e1rm`         | Estimated 1RM over time        |
| GET    | `/api/progress/muscles/:muscleGroup/charts/weekly-volume` | Weekly volume by muscle group  |
| GET    | `/api/progress/adherence/weekly`                          | Weekly adherence summary       |
| GET    | `/api/progress/exercises/:exerciseId/suggested-load`      | Suggested load for current gym |
| GET    | `/api/goals/training`                                     | Get weekly training target     |
| PUT    | `/api/goals/training`                                     | Update weekly training target  |

## 12.6 Future Extensions (MVP 3)

- **Personal Page Customization**: 自訂封面、主題色、區塊排序
- **Advanced Export**: 匯出 CSV/JSON 格式訓練資料
