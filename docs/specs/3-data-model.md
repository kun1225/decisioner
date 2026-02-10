# 3. Data Model

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         users                                   │
├─────────────────────────────────────────────────────────────────┤
│ id: uuid (PK)                                                   │
│ email: varchar(255) UNIQUE                                      │
│ name: varchar(255)                                              │
│ hashed_password: varchar(255)                                   │
│ created_at: timestamp                                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ 1:N
                ┌─────────────┴──────────────────────┐
                ▼                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                        decisions                                │
├─────────────────────────────────────────────────────────────────┤
│ id: uuid (PK)                                                   │
│ user_id: uuid (FK → users)                                      │
│ title: varchar(200) NOT NULL                                    │
│ description: text                                               │
│ context: text                                                   │
│ expected_outcome: text                                          │
│ final_choice: text (nullable, filled on freeze)                 │
│ status: enum [DRAFT, ACTIVE, CLOSED]                            │
│ category: varchar(100)                                          │
│ decision_deadline: timestamp (required)                         │
│ supersedes_decision_id: uuid (nullable, FK → decisions)         │
│ reconsider_reason: text (nullable)                              │
│ created_at: timestamp                                           │
│ frozen_at: timestamp (nullable)                                 │
│ closed_at: timestamp (nullable)                                 │
└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│                      refresh_tokens                             │
├─────────────────────────────────────────────────────────────────┤
│ id: uuid (PK)                                                   │
│ user_id: uuid (FK → users)                                      │
│ jti: varchar(255) UNIQUE                                        │
│ family_id: varchar(255)                                         │
│ token_hash: varchar(255)                                        │
│ expires_at: timestamp                                           │
│ revoked_at: timestamp (nullable)                                │
│ replaced_by_jti: varchar(255) (nullable)                        │
│ created_at: timestamp                                           │
└─────────────────────────────────────────────────────────────────┘
         │                    │                    │
         │ 1:N                │ 1:N                │ 1:N
         ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   hypotheses    │  │    evidence     │  │     reviews     │
├─────────────────┤  ├─────────────────┤  ├─────────────────┤
│ id: uuid (PK)   │  │ id: uuid (PK)   │  │ id: uuid (PK)   │
│ decision_id: FK │  │ decision_id: FK │  │ decision_id: FK │
│ content: text   │  │ hypothesis_id?  │  │ outcome: text   │
│ order: int      │  │ content: text   │  │ lessons: text   │
│ created_at      │  │ url: varchar?   │  │ created_at      │
└────────┬────────┘  │ created_at      │  └────────┬────────┘
         │           └─────────────────┘           │
         │ 1:N                                     │ 1:N
         ▼                                         ▼
┌─────────────────────────────────┐  ┌─────────────────────────────────┐
│      confidence_snapshots       │  │     hypothesis_assessments      │
├─────────────────────────────────┤  ├─────────────────────────────────┤
│ id: uuid (PK)                   │  │ id: uuid (PK)                   │
│ hypothesis_id: uuid (FK)        │  │ review_id: uuid (FK)            │
│ confidence: int (0-100)         │  │ hypothesis_id: uuid (FK)        │
│ reason: text                    │  │ assessment: enum                │
│ created_at: timestamp           │  │ note: text                      │
│ is_frozen: boolean              │  └─────────────────────────────────┘
└─────────────────────────────────┘
```

Note: Authentication 使用 access token（JWT, stateless）+ refresh token rotation（DB stateful via `refresh_tokens` table）。

## Indexes

| Table                  | Index                                  | Columns       |
| ---------------------- | -------------------------------------- | ------------- |
| decisions              | decisions_user_id_idx                  | user_id       |
| decisions              | decisions_status_idx                   | status        |
| decisions              | decisions_created_at_idx               | created_at    |
| hypotheses             | hypotheses_decision_id_idx             | decision_id   |
| confidence_snapshots   | confidence_snapshots_hypothesis_id_idx | hypothesis_id |
| confidence_snapshots   | confidence_snapshots_created_at_idx    | created_at    |
| evidence               | evidence_decision_id_idx               | decision_id   |
| evidence               | evidence_hypothesis_id_idx             | hypothesis_id |
| reviews                | reviews_decision_id_idx                | decision_id   |
| hypothesis_assessments | hypothesis_assessments_review_id_idx   | review_id     |
| refresh_tokens         | refresh_tokens_user_id_idx             | user_id       |
| refresh_tokens         | refresh_tokens_family_id_idx           | family_id     |
| refresh_tokens         | refresh_tokens_expires_at_idx          | expires_at    |
| refresh_tokens         | refresh_tokens_jti_key (UNIQUE)        | jti           |

## Enums

```sql
-- Decision Status
CREATE TYPE decision_status AS ENUM ('DRAFT', 'ACTIVE', 'CLOSED');

-- Hypothesis Assessment
CREATE TYPE hypothesis_assessment AS ENUM ('CONFIRMED', 'PARTIALLY', 'WRONG', 'UNKNOWN');
```

## Key Design Decisions

1. **ConfidenceSnapshot** 而非直接在 Hypothesis 上存 confidence
   - 保留完整歷史，支援 "View History" 功能
   - `is_frozen` 標記凍結時刻的值

2. **Evidence 可連結特定 Hypothesis**
   - `hypothesis_id` 為 optional FK
   - 支援通用證據（關聯 Decision）或具體證據（關聯 Hypothesis）

3. **Review 是獨立實體，支援多次回顧**
   - 一個 Decision 可有多個 Review
   - 每個 Review 記錄時間點的觀察

4. **Reconsider 透過新 Decision，不回寫原決策**
   - 新決策以 `supersedes_decision_id` 連結原決策
   - 原決策保持凍結快照，方便回顧
   - 新決策會複製原決策的 evidence

5. **HypothesisAssessment 在 Review 內**
   - 每次回顧時評估每個假設
   - 同一假設可在不同時間點有不同評估

6. **Refresh Token 採用 Rotation + Reuse Detection**
   - refresh token 只存 hash，不存明文 token
   - 透過 `jti` + `family_id` 支援輪替與整個 token family 撤銷
