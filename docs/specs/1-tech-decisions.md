# 1. Technology Decisions

## 1.1 ORM: Drizzle (over Prisma)

**Decision:** 使用 Drizzle ORM。

**Why:**

1. 可精準控制 SQL（fitness analytics 與聚合查詢較多）
2. monorepo 下不需要額外 code generation 流程
3. type inference 直接由 schema 推導，維護成本低

## 1.2 Authentication: DIY JWT (Local + Google)

**Decision:** 使用 `bcrypt + jsonwebtoken + refresh token rotation`。

**Why:**

1. 與 Express 整合最直接
2. Access token stateless，API 擴展簡單
3. Refresh token 可撤銷，可防重放

## 1.3 API Style: REST + Domain Modules

**Decision:** 採 REST API，按 domain 切模組（workouts/templates/social 等）。

**Why:**

1. 前後端職責清楚
2. 可逐模組獨立開發與測試
3. 對行動端或其他 client 擴充友善

## 1.4 Media Storage: S3 + Pre-signed Upload

**Decision:** 動作圖片採 S3 直傳（pre-signed URL）。

**Why:**

1. 降低 API 帶寬壓力
2. 可直接接 CDN 提升載入速度
3. 能以 object key 管理資產生命週期

## 1.5 History Strategy: Append-Only for Critical Changes

**Decision:** 對關鍵可回溯資料採 append-only：

1. `template_versions` 保留課表每次編輯快照
2. `workout_session_revisions` 保留已完成訓練的編輯歷史

**Why:**

1. 可審計多人協作與歷史修正
2. 避免「直接覆蓋」導致資料來源不明

## 1.6 Frontend Runtime: TanStack Start (React 19 + Vite)

**Decision:** 前端採用 `@tanstack/react-start`，以 `React 19 + Vite` 為執行與建置基礎。

**Why:**

1. 與 TanStack Router/Query 同 ecosystem，路由與資料載入模型一致
2. Vite 開發啟動與 HMR 速度快，適合前後端並行開發
3. 能保留 SSR/route loader 能力，同時維持 React 原生開發體驗

## 1.7 UI System: shadcn (Base UI Version) + Tailwind CSS v4

**Decision:** UI 元件採用 `shadcn`（`@base-ui/react` 版本）並以 `tailwindcss v4` 建構設計系統。

**Why:**

1. Base UI primitives 提供可組合且可存取的底層元件
2. shadcn + CVA (`class-variance-authority`) 可建立可維護的變體 API
3. `clsx + tailwind-merge + tw-animate-css` 提供一致的 class 組合與動畫能力

## 1.8 Frontend Data Layer and Testing

**Decision:** 使用 `@tanstack/react-query` 管理伺服器狀態，測試採用 `Vitest + Testing Library`。

**Why:**

1. Query cache、invalidations 與 optimistic update 模型成熟
2. 可直接搭配 Router loader 與 route-level prefetch
3. `vitest + jsdom + @testing-library/react` 可快速覆蓋元件與整合測試
