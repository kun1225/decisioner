# Appendix B: Decision State Machine

## Decision State Machine

```
                    ┌─────────┐
                    │  DRAFT  │
                    └────┬────┘
                         │
            ┌────────────┴────────────┐
            │                         │
            │  • Edit content         │
            │  • Add hypotheses       │
            │  • Adjust confidence    │
            │  • Add evidence         │
            │  • Extend deadline      │
            │                         │
            └────────────┬────────────┘
                         │
                    [Freeze]
                         │
                         ▼
                    ┌─────────┐
                    │ ACTIVE  │
                    └────┬────┘
                         │
            ┌────────────┴────────────┐
            │                         │
            │  • View frozen content  │
            │  • Add reviews          │
            │  • Add evidence         │
            │  • View history         │
            │  • Reconsider           │
            │                         │
            │  ✗ Cannot edit content  │
            │                         │
            └────────────┬────────────┘
                         │
                    [Close]
                         │
                         ▼
                    ┌─────────┐
                    │ CLOSED  │
                    └─────────┘
                         │
            ┌────────────┴────────────┐
            │                         │
            │  • View frozen content  │
            │  • Add reviews          │
            │  • View history         │
            │  • Reconsider           │
            │                         │
            │  ✗ Cannot edit          │
            │  ✗ Cannot add evidence  │
            │                         │
            └─────────────────────────┘
```

**Notes:**

- DRAFT 編輯、信心調整與新增 evidence 僅允許在 `decision_deadline` 前進行
- Extend Deadline 可在 DRAFT 任何時間使用，且每次需填寫原因
- deadline 到期後，僅能 Freeze 或 Extend Deadline
- Reconsider 不會改變原決策狀態，而是建立新的 DRAFT 並連結到原決策

### State Transition Rules

| Current State | Action          | Next State  | Allowed Operations After                                    |
| ------------- | --------------- | ----------- | ----------------------------------------------------------- |
| DRAFT         | Create          | DRAFT       | Edit, Add Evidence, Adjust Confidence (before deadline)     |
| DRAFT         | Extend Deadline | DRAFT       | Edit, Add Evidence, Adjust Confidence (before new deadline; reason required) |
| DRAFT         | Freeze          | ACTIVE      | Add Review, Add Evidence, View History, Reconsider          |
| ACTIVE        | Close           | CLOSED      | Add Review, View History, Reconsider                        |
| ACTIVE        | Reconsider      | DRAFT (new) | Edit, Add Evidence, Adjust Confidence                       |
| ACTIVE        | -               | ACTIVE      | Original decision cannot go back to DRAFT (use Reconsider)  |
| CLOSED        | Reconsider      | DRAFT (new) | Edit, Add Evidence, Adjust Confidence                       |
| CLOSED        | -               | CLOSED      | Terminal state (read-only except review & reconsider)       |

---
