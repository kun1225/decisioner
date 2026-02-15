# 8. Frontend Architecture

## 8.1 Route Structure

| Route                   | Purpose                                                              |
| ----------------------- | -------------------------------------------------------------------- |
| `/`                     | Dashboard                                                            |
| `/feed`                 | Friend activity feed and interactions                                |
| `/templates`            | Template list/create/edit                                            |
| `/train/start`          | Select gym/template and start session                                |
| `/train/$sessionId`     | Training editor (in-progress + past edit)                            |
| `/workouts/history`     | Past workout list (date + template)                                  |
| `/checkins`             | Daily check-ins and streak history                                   |
| `/progress`             | Charts and records (MVP: max-weight/volume; Pro: advanced analytics) |
| `/friends`              | Friend list and recent activity                                      |
| `/users/$userId`        | Basic profile page (privacy-scoped)                                  |
| `/crews`                | Crew management and shared templates                                 |
| `/settings/privacy`     | Visibility settings                                                  |
| `/settings/reminders`   | Reminder settings                                                    |

## 8.2 Component Architecture (Feature-based)

採用 **Feature-based** 結構組織元件，避免 `src/components` 過度膨脹。

```text
src/
├── components/          # Shared generic UI (buttons, inputs, layouts)
│   ├── ui/              # shadcn primitives
│   └── shared/          # App-wide shared components (e.g., UserAvatar)
├── features/            # Domain-specific logic & UI
│   ├── auth/            # Login, register, guard
│   ├── workouts/        # Session editor, history list, set row
│   ├── templates/       # Template builder, version history
│   ├── progress/        # Charts, stats cards
│   ├── social/          # Feed, friends list, crew management
│   ├── dashboard/       # Dashboard widgets, check-in modal
│   └── settings/        # Privacy, reminders form
├── hooks/               # Global hooks (useAuth, useTheme)
├── routes/              # TanStack Router definitions
└── lib/                 # Utilities, API client
```

### 8.2.1 Feature Directory Structure Example

```text
src/features/workouts/
├── components/
│   ├── SessionEditor.tsx
│   ├── SetRow.tsx
│   └── ExercisePicker.tsx
├── hooks/
│   └── useSessionTimer.ts
├── api/
│   ├── queries.ts       # TanStack Query keys & fetchers
│   └── mutations.ts
└── types.ts             # Feature-specific types
```

## 8.3 Key Screen Contracts

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
3. set 編輯欄位包含：`weight`, `reps`, `unit`
4. Pro 可開啟進階欄位：`rpe`, `rir`
5. Pro 顯示 `suggested load` 與「記住此 gym 差異」切換
6. 送出變更後提示已更新歷史版本

### `/progress`

> 詳細 Pro 圖表邏輯請參閱 **[12-pro-features.md](./12-pro-features.md)**

1. 分頁/切換至少包含：
   - Last/Best（單動作）
   - Max Weight（單動作）
   - Volume（單動作）
2. Pro 版本才顯示：
   - e1RM（單動作）
   - Weekly Muscle Volume（肌群）
   - Weekly Adherence（週完成率）
   - RPE/RIR 相關分析
3. 免費版顯示升級提示，不回傳 Pro 圖表資料

### `/` (dashboard)

1. 顯示本週訓練次數、目前 streak、最近打卡日期
2. 顯示近期好友互動摘要（受隱私控制）
3. 可快速入口到「立即打卡」與「分享卡片」

### `/feed`

1. 顯示好友 `WORKOUT_STARTED/COMPLETED/CHECKIN_CREATED` 事件流
2. 卡片支援 like/unlike
3. 被隱私限制的內容需降級顯示或隱藏

### `/users/$userId`

1. 顯示基本個人頁（頭像、簡介、近期訓練摘要）
2. 受 `privacy_settings` 控制字段可見性

## 8.4 Data Fetching Strategy

1. 伺服器狀態：TanStack Query
2. 路由資料：TanStack Router loader
3. mutation：API calls + query invalidation

建議 query keys：

1. `['workout-history', userId, cursor]`
2. `['workout-session', sessionId]`
3. `['exercise-last-best', exerciseId, gymId]`
4. `['progress-chart', exerciseId, chartType, from, to, gymId]`
5. `['progress-e1rm', exerciseId, from, to, gymId]`（Pro）
6. `['progress-muscle-weekly-volume', muscleGroup, from, to, includeSecondary]`（Pro）
7. `['progress-adherence-weekly', from, to]`（Pro）
8. `['suggested-load', exerciseId, gymId]`（Pro）
9. `['dashboard', userId, weekStart]`
10. `['checkins', userId, cursor]`
11. `['feed', userId, cursor]`
12. `['feed-like-state', eventId]`
13. `['user-profile', targetUserId, viewerUserId]`
14. `['reminders', userId]`
15. `['share-card-templates', planTier]`

## 8.5 UX Guards

1. 編輯 completed session 前，提示將重算個人統計
2. 朋友頁若無權限，明確顯示「對方未開放此資訊」
3. template 編輯衝突時顯示版本衝突提示並要求重新載入
4. crews 頁需顯示免費限制：每人最多 1 群、每群最多 2 人
5. 分享卡片若使用 Pro 模板，免費版需顯示升級引導

## 8.6 Frontend Stack Snapshot (`apps/web/package.json`)

| Layer             | Packages                                                                                                    | Notes                                    |
| ----------------- | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| App Runtime       | `react`, `react-dom`, `@tanstack/react-start`, `@tanstack/react-router`, `@tanstack/router-plugin`, `nitro` | React 19 + TanStack Start + Vite runtime |
| Data and Routing  | `@tanstack/react-query`, `@tanstack/react-router-ssr-query`                                                 | Query cache + loader/prefetch 整合       |
| UI System         | `shadcn`, `@base-ui/react`, `tailwindcss`, `@tailwindcss/vite`, `tw-animate-css`                            | shadcn (Base UI 版本) + Tailwind CSS v4  |
| UI Utilities      | `class-variance-authority`, `clsx`, `tailwind-merge`                                                        | immutable class composition 與 variants  |
| Icons/Typography  | `lucide-react`, `@tabler/icons-react`, `@fontsource-variable/geist`                                         | 前端視覺資產                             |
| Testing and Lint  | `vitest`, `@testing-library/react`, `@testing-library/dom`, `jsdom`, `eslint`, `@tanstack/eslint-config`    | 單元/整合測試與靜態檢查                  |
| TypeScript and DX | `typescript`, `vite`, `@vitejs/plugin-react`, `vite-tsconfig-paths`, `babel-plugin-react-compiler`          | 型別、建置、路徑 alias、React compiler   |
| Devtools          | `@tanstack/react-devtools`, `@tanstack/react-query-devtools`, `@tanstack/react-router-devtools`             | 本地開發調試                             |
