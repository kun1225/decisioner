# 7. Authentication

## 7.1 Overview

驗證模型：`Access Token + Refresh Token Rotation`

1. Access Token：JWT，短效，帶 `Authorization: Bearer`
2. Refresh Token：JWT，長效，放 HttpOnly cookie，DB 管理可撤銷

身份來源：

1. `LOCAL`（email/password）
2. `GOOGLE`（idToken 驗證）

## 7.2 Token Contract

### Access Token

1. 建議效期：15 分鐘
2. claims：`userId`, `email`
3. 不落地資料庫（stateless）

### Refresh Token

1. 建議效期：30 天
2. claims：`userId`, `jti`, `familyId`
3. cookie：`HttpOnly + Secure + SameSite=Strict`
4. DB 只存 hash，不存明文 token

## 7.3 Rotation & Reuse Detection

1. refresh 成功：
   - revoke 舊 token
   - issue 新 refresh + access
2. 若偵測到 revoked token 重用：
   - revoke 同 family 全部 token
   - 強制重新登入

## 7.4 Security Controls

1. 密碼必須 bcrypt hash
2. Google idToken 必驗 `aud/iss/exp/email_verified`
3. auth 端點加 rate limit
4. 錯誤訊息避免透露帳號存在與否

## 7.5 Authorization Baseline

1. 所有 fitness domain 寫入端點需登入
2. 讀朋友資料需同時通過 friendship + privacy 判斷
3. 資料權限預設 owner-only，社交可見性由 `privacy_settings` 放寬
