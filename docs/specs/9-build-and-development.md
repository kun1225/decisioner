# 9. Build & Development

## 9.1 Scripts

```bash
# root
pnpm dev
pnpm build
pnpm lint
pnpm check-types
pnpm test

# database
pnpm db:generate
pnpm db:migrate
pnpm db:studio
```

## 9.2 Environment Variables

```bash
# Database
DATABASE_URL="postgresql://..."

# API
PORT=4000
API_URL="http://localhost:4000"

# JWT
ACCESS_TOKEN_SECRET="..."
REFRESH_TOKEN_SECRET="..."

# Google Auth
GOOGLE_CLIENT_ID="..."

# S3 Media
S3_REGION="ap-northeast-1"
S3_BUCKET="decisioner-fitness-assets"
S3_ACCESS_KEY_ID="..."
S3_SECRET_ACCESS_KEY="..."
S3_PUBLIC_BASE_URL="https://cdn.example.com"

# App
NODE_ENV="development"
```

## 9.3 Local Development Notes

1. 啟動前確認 DB 可連線
2. migration 先跑再啟動 API
3. S3 可先用測試 bucket 與 lifecycle policy
4. CI 應包含 lint + typecheck + test

## 9.4 Quality Gate

1. 單元 + 整合 + E2E 目標覆蓋率 80%+
2. 針對隱私與權限需有整合測試
3. 針對 past workout edit 需有回歸測試（metrics 重算）
