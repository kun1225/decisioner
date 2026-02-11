# 8. Frontend Architecture

## 8.1 Route Structure

| Route               | Purpose                                   |
| ------------------- | ----------------------------------------- |
| `/`                 | Dashboard                                 |
| `/templates`        | Template list/create/edit                 |
| `/train/start`      | Select gym/template and start session     |
| `/train/$sessionId` | Training editor (in-progress + past edit) |
| `/workouts/history` | Past workout list (date + template)       |
| `/progress`         | Charts and records                        |
| `/friends`          | Friend list and recent activity           |
| `/crews`            | Crew management and shared templates      |
| `/settings/privacy` | Visibility settings                       |

## 8.2 Key Screen Contracts

### `/workouts/history`

顯示欄位：

1. 訓練日期
2. template 名稱（或「手動訓練」）
3. 最後編輯時間

點擊卡片：

1. 導向 `/train/$sessionId`
2. 載入可編輯 session editor

### `/train/$sessionId`

1. `IN_PROGRESS`：正常記錄模式
2. `COMPLETED`：顯示「編輯歷史訓練」模式（仍可編輯）
3. 送出變更後提示已更新歷史版本

## 8.3 Data Fetching Strategy

1. 伺服器狀態：TanStack Query
2. 路由資料：TanStack Router loader
3. mutation：API calls + query invalidation

建議 query keys：

1. `['workout-history', userId, cursor]`
2. `['workout-session', sessionId]`
3. `['exercise-last-best', exerciseId, gymId]`
4. `['progress-chart', exerciseId, chartType]`

## 8.4 UX Guards

1. 編輯 completed session 前，提示將重算個人統計
2. 朋友頁若無權限，明確顯示「對方未開放此資訊」
3. template 編輯衝突時顯示版本衝突提示並要求重新載入
