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
