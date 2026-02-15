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

## 5.4 Free-Lite Social Limits (MVP)

1. 每位使用者最多建立 1 個 crew
2. 每個 crew 最多 2 位成員（owner + 1）
3. 超出限制時拒絕狀態轉移，回傳 `422 FREE_TIER_LIMIT_EXCEEDED`

## 5.5 Check-in State (MVP)

```text
NONE --create checkin--> CHECKED_IN
CHECKED_IN --next day--> NONE
```

| Current    | Action         | Next       | Notes                            |
| ---------- | -------------- | ---------- | -------------------------------- |
| NONE       | Create checkin | CHECKED_IN | 同日首次打卡成功                 |
| CHECKED_IN | Create checkin | CHECKED_IN | 同日重複請求不新增（idempotent） |
| CHECKED_IN | Day rollover   | NONE       | 進入新的一天                     |
