# 5. State Machine

## 5.1 Workout Session State

```text
IN_PROGRESS --finish--> COMPLETED
COMPLETED --edit--> COMPLETED
```

### Transition Rules

| Current     | Action                     | Next        | Notes                       |
| ----------- | -------------------------- | ----------- | --------------------------- |
| IN_PROGRESS | Add/Edit/Delete sets/items | IN_PROGRESS | 即時編輯                    |
| IN_PROGRESS | Finish session             | COMPLETED   | 產生 metrics / achievements |
| COMPLETED   | Edit past session          | COMPLETED   | 建立 revision + 重新計算    |

### Constraints

1. `COMPLETED` 不回到 `IN_PROGRESS`
2. past edit 必須記錄 revision（避免 silent overwrite）
3. past edit 後需重算 progress 與成就事件

## 5.2 Friend Request State

```text
PENDING --accept--> ACCEPTED
PENDING --block--> BLOCKED
ACCEPTED --block--> BLOCKED
```

| Current  | Action | Next     |
| -------- | ------ | -------- |
| PENDING  | Accept | ACCEPTED |
| PENDING  | Block  | BLOCKED  |
| ACCEPTED | Block  | BLOCKED  |

## 5.3 Template Lifecycle

```text
ACTIVE --archive--> ARCHIVED
ARCHIVED --restore--> ACTIVE
```

1. template item 可編輯，但每次變更都要產生新 version
2. shared template 由 crew member 編輯時也套用相同版本規則
