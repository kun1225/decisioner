# Appendix C: Data Model

## Data Model (Conceptual)

```
┌─────────────────────────────────────────────────────────────────┐
│                         User                                    │
├─────────────────────────────────────────────────────────────────┤
│ id: UUID (PK)                                                   │
│ email: string (unique)                                          │
│ name: string                                                    │
│ hashed_password: string                                         │
│ created_at: timestamp                                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ 1:N
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Decision                                 │
├─────────────────────────────────────────────────────────────────┤
│ id: UUID (PK)                                                   │
│ user_id: UUID (FK → User)                                       │
│ title: string (max 200)                                         │
│ description: text                                               │
│ context: text                                                   │
│ expected_outcome: text                                          │
│ final_choice: text (nullable, filled on freeze)                 │
│ status: enum [DRAFT, ACTIVE, CLOSED]                            │
│ category: string (optional)                                     │
│ decision_deadline: timestamp (required)                         │
│ supersedes_decision_id: UUID (nullable, FK → Decision)          │
│ reconsider_reason: text (nullable)                              │
│ created_at: timestamp                                           │
│ frozen_at: timestamp (nullable)                                 │
│ closed_at: timestamp (nullable)                                 │
└─────────────────────────────────────────────────────────────────┘
         │                    │                    │
         │ 1:N                │ 1:N                │ 1:N
         ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   Hypothesis    │  │    Evidence     │  │     Review      │
├─────────────────┤  ├─────────────────┤  ├─────────────────┤
│ id: UUID (PK)   │  │ id: UUID (PK)   │  │ id: UUID (PK)   │
│ decision_id: FK │  │ decision_id: FK │  │ decision_id: FK │
│ content: text   │  │ content: text   │  │ outcome: text   │
│ order: int      │  │ url: string?    │  │ lessons: text   │
│ created_at      │  │ hypothesis_id?  │  │ created_at      │
└────────┬────────┘  │ created_at      │  └─────────────────┘
         │           └─────────────────┘
         │ 1:N
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ConfidenceSnapshot                           │
├─────────────────────────────────────────────────────────────────┤
│ id: UUID (PK)                                                   │
│ hypothesis_id: UUID (FK → Hypothesis)                           │
│ confidence: int (0-100)                                         │
│ reason: text (why this confidence level)                        │
│ created_at: timestamp                                           │
│ is_frozen: boolean (true if captured at freeze time)            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    HypothesisAssessment                         │
├─────────────────────────────────────────────────────────────────┤
│ id: UUID (PK)                                                   │
│ review_id: UUID (FK → Review)                                   │
│ hypothesis_id: UUID (FK → Hypothesis)                           │
│ assessment: enum [CONFIRMED, PARTIALLY, WRONG, UNKNOWN]         │
│ note: text                                                      │
└─────────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

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

---
