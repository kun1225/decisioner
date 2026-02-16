# 3. Backend Architecture

## 3.1 Runtime

1. Node.js + Express
2. Drizzle ORM + PostgreSQL
3. JWT auth（access token + refresh token rotation）

## 3.2 Module Boundaries

1. `auth`: register/login/refresh/logout/me
2. `media`: pre-signed upload URL + complete binding
3. `exercises`: preset/custom exercise
4. `gyms`: gym CRUD（MVP 以建立/查詢為主）
5. `templates`: template CRUD + versioning + share
6. `workouts`: start/session edit/sets/finish/history
7. `progress`: last-best + charts
8. `social`: friends/crews/privacy
9. `engagement`: checkins/feed/likes/reminders/share-cards
10. `achievements`: definition/event/timeline

## 3.3 Request Flow

1. Route -> Controller -> Service -> Repository(DB)
2. Controller 只做 transport mapping 與 validation
3. Service 處理 business rules（privacy/plan/limits）
4. Repository 負責 DB query 與 transaction

## 3.4 Security Baseline

1. 所有寫入 API 預設 require auth
2. refresh token 存 HttpOnly cookie，DB 僅存 hash
3. privacy guard 套用在 friend/profile/feed 讀取路徑
4. 錯誤訊息不洩漏敏感資訊（帳號存在與否、內部細節）

## 3.5 Data Integrity Baseline

1. 關鍵歷史資料 append-only（template versions / session revisions）
2. completed session 編輯後需重算 metrics
3. social/engagement 依 unique constraints 去重（例如 likes, daily check-in）

## 3.6 Deployment Notes

1. `apps/api` 與 `packages/database` 透過 migration 管理 schema
2. API 對外只暴露 `/api/*`
3. 與 web 透過 CORS 白名單協作
