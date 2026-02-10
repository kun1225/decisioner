# 1. Technology Decisions

## 1.1 ORM: Drizzle (over Prisma)

**Decision:** 選擇 Drizzle ORM

**Rationale:**

| Aspect          | Drizzle                | Prisma                 |
| --------------- | ---------------------- | ---------------------- |
| Bundle Size     | ~35KB                  | ~2MB                   |
| SQL Control     | 完整控制，可寫 raw SQL | 抽象層，較難優化       |
| Code Generation | 不需要                 | 需要 `prisma generate` |
| Type Safety     | SQL-like 語法推導      | 從 schema 生成         |
| Monorepo        | 簡單 package           | 需要 generate step     |

**For this project:**

1. Confidence snapshot 需要 SQL-level 控制（history 查詢、aggregation）
2. TanStack Start server functions 需要輕量 bundle
3. Monorepo 不需要額外的 code generation step

---

## 1.2 Authentication: DIY (bcrypt + JWT)

**Decision:** 使用 bcrypt + jsonwebtoken

**Rationale:**

| Aspect       | DIY (bcrypt + JWT)                            | Lucia        | Clerk           | Auth.js           |
| ------------ | --------------------------------------------- | ------------ | --------------- | ----------------- |
| Philosophy   | Full control, no magic                        | Low-level    | Managed service | Framework-focused |
| Express 整合 | 原生支援                                      | 需要 adapter | SDK             | 主要為 Next.js    |
| 成本         | 免費                                          | 免費         | 付費            | 免費              |
| Session 管理 | Access JWT（stateless）+ Refresh rotation（DB） | DB session   | 託管            | DB session        |
| 學習價值     | 高                                            | 中           | 低              | 中                |

**For this project:**

1. Express.js 後端原生整合，無需額外 adapter
2. JWT token-based 適合 SPA + API 分離架構（TanStack Start + Express）
3. API 授權層維持 stateless（access token），同時用 refresh token rotation 提供可撤銷與重放防護
4. Lucia 作者已建議改為 DIY（官網公告）
5. 用 bcrypt（密碼雜湊）+ jsonwebtoken 皆為成熟穩定的 npm 套件
