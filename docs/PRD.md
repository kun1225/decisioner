# Product Requirements Document: Decision Log

> **Version:** 1.0.0
> **Status:** Draft
> **Last Updated:** 2026-02-05
> **Author:** [Your Name]

---

## Executive Summary

Decision Log 是一個個人決策記錄系統，幫助使用者在做重要決策時記錄當下的判斷依據，並在事後誠實回顧決策品質。核心價值在於**防止事後美化歷史**——透過「凍結」機制鎖定決策當下的思考脈絡，讓未來的自己能客觀檢視過去的判斷模式。

### Why Now?

1. **認知偏誤的普遍性**：後見之明偏誤讓人難以從決策中學習，市面上缺乏專注於「保存決策當下狀態」的工具
2. **個人知識管理趨勢**：隨著 Second Brain、PKM 工具普及，決策記錄是尚未被充分解決的垂直領域
3. **技術學習機會**：作為 TanStack Start + Express + PostgreSQL monorepo 的實戰專案

---

## Problem Statement

### The Core Problem

人們在回顧過去的決策時，會不自覺地：

- **重寫記憶**：根據結果調整對「當初想法」的回憶
- **後見之明**：認為結果是可預見的，低估當時的不確定性
- **選擇性記憶**：只記得支持最終選擇的理由

這導致我們**無法從決策中真正學習**，因為我們比較的不是「當初的判斷 vs 實際結果」，而是「被結果污染的記憶 vs 實際結果」。

### User Pain Points

| Pain Point               | Current Workaround | Why It Fails             |
| ------------------------ | ------------------ | ------------------------ |
| 忘記當初為什麼做這個決定 | 筆記軟體隨手記     | 沒有結構化，難以回顧比較 |
| 事後美化當初的判斷       | 信任自己的記憶     | 記憶會被結果污染         |
| 不知道自己的決策盲點     | 憑感覺反思         | 缺乏跨決策的模式識別     |
| 記錄太麻煩所以不記       | 放棄記錄           | 失去學習機會             |

---

## Goals & Non-Goals

### Goals

| Priority | Goal                               | Success Signal               |
| -------- | ---------------------------------- | ---------------------------- |
| P0       | 讓使用者在決策時記錄假設與信心程度 | 使用者願意填寫假設與信心值   |
| P0       | 透過「凍結」機制防止事後修改       | 凍結後的決策內容不可編輯     |
| P1       | 支援事後回顧與學習記錄             | 使用者在決策後會回來新增回顧 |
| P1       | 保存完整的決策歷史軌跡             | 能看到假設信心的變化過程     |
| P2       | 支援跨決策的模式識別               | 使用者能從多個決策中發現規律 |

### Non-Goals (Explicitly Out of Scope)

- ❌ **提升決策成功率**：這不是決策輔助工具
- ❌ **評分或評判決策好壞**：系統不做價值判斷
- ❌ **協作功能**：MVP 階段只支援個人使用
- ❌ **任務管理**：不是待辦清單或專案管理
- ❌ **AI 輔助建議**：不在 MVP 範圍
- ❌ **公開分享**：不在 MVP 範圍

---

## Target Users

### Primary Persona: The Reflective Decision Maker

**Profile:**

- 會做需要回顧的決策（技術選型、職涯、投資、產品方向）
- 有自我反思的習慣，但缺乏系統化方法
- 願意面對「我可能判斷錯了」的現實
- 對認知偏誤有基本認識

**Behaviors:**

- 傾向用文字整理思緒
- 會回頭檢視過去的決定
- 對「當初怎麼想的」這件事有興趣

**Frustrations:**

- 事後才發現當初的判斷有盲點，但記不清原本怎麼想的
- 想從過去學習，但缺乏可靠的記錄

### User Scale (MVP)

- **Initial:** 自己 + 2-5 位早期測試者
- **Authentication:** 需要基本帳戶系統
- **Multi-tenancy:** 資料隔離，各人只看自己的決策

---

## User Scenarios & Flows

### Scenario A: Recording a Decision in Progress

**Context:** 使用者正在考慮是否要轉換工作，想記錄目前的思考脈絡。

**User Flow:**

```
┌─────────────────────────────────────────────────────────────────┐
│  Flow 1: Create & Draft Decision                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Click "New Decision"                                        │
│              │                                                  │
│              ▼                                                  │
│  2. Enter title & description                                   │
│     "Should I accept the job offer from Company X?"             │
│              │                                                  │
│              ▼                                                  │
│  3. Add context/background                                      │
│     "Current job stability, new offer details, market..."       │
│              │                                                  │
│              ▼                                                  │
│  4. List hypotheses with confidence (0-100%)                    │
│     ┌─────────────────────────────────────────────┐             │
│     │ H1: New role will offer more growth (75%)   │             │
│     │ H2: Team culture is better (40%)            │             │
│     │ H3: Compensation offsets risk (60%)         │             │
│     └─────────────────────────────────────────────┘             │
│              │                                                  │
│              ▼                                                  │
│  5. Define expected outcomes                                    │
│     "If I accept: expect to feel engaged in 3 months..."        │
│              │                                                  │
│              ▼                                                  │
│  6. Set decision deadline                                       │
│     "Decide by: 2026-02-20"                                     │
│              │                                                  │
│              ▼                                                  │
│  7. Save as Draft                                               │
│     Status: DRAFT                                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### Scenario B: Updating with New Information

**Context:** 使用者面試後獲得新資訊，想更新判斷但不想重寫歷史。

**User Flow:**

```
┌─────────────────────────────────────────────────────────────────┐
│  Flow 2: Add Evidence & Adjust Confidence                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Open existing decision (Status: DRAFT)                      │
│              │                                                  │
│              ▼                                                  │
│  2. Add new evidence                                            │
│     ┌─────────────────────────────────────────────┐             │
│     │ + Link: Glassdoor reviews                   │             │
│     │ + Note: "Interview revealed flat hierarchy" │             │
│     └─────────────────────────────────────────────┘             │
│              │                                                  │
│              ▼                                                  │
│  3. Adjust hypothesis confidence                                │
│     H2: Team culture is better                                  │
│         40% → 65% (▲ +25%)                                      │
│     ┌─────────────────────────────────────────────┐             │
│     │ Reason: "Interview confirmed flat structure"│             │
│     └─────────────────────────────────────────────┘             │
│              │                                                  │
│              ▼                                                  │
│  4. System records change as new version                        │
│     (Previous 40% preserved in history)                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Key Constraint:** 信心調整會保留歷史記錄，不是覆蓋，且僅能在 `decision_deadline` 前進行。

---

### Scenario C: Freezing the Decision

**Context:** 使用者已經決定接受 offer，要鎖定當下的判斷狀態。

**User Flow:**

```
┌─────────────────────────────────────────────────────────────────┐
│  Flow 3: Freeze Decision                                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Open decision (Status: DRAFT)                               │
│              │                                                  │
│              ▼                                                  │
│  2. Click "Freeze Decision"                                     │
│              │                                                  │
│              ▼                                                  │
│  3. Confirmation dialog                                         │
│     ┌─────────────────────────────────────────────┐             │
│     │ ⚠️ Once frozen, you cannot edit:            │             │
│     │   • Description & context                   │             │
│     │   • Hypotheses                              │             │
│     │   • Confidence values                       │             │
│     │   • Expected outcomes                       │             │
│     │                                             │             │
│     │ You can still:                              │             │
│     │   • Add evidence later                      │             │
│     │   • Add reviews later                       │             │
│     │   • View full history                       │             │
│     │                                             │             │
│     │ If new evidence changes your choice:        │             │
│     │   • Use Reconsider to create a new decision │             │
│     │                                             │             │
│     │ [Cancel]  [Freeze Decision]                 │             │
│     └─────────────────────────────────────────────┘             │
│              │                                                  │
│              ▼                                                  │
│  4. Record final choice (optional)                              │
│     "Decision: Accept the offer"                                │
│              │                                                  │
│              ▼                                                  │
│  5. Status changes: DRAFT → ACTIVE                              │
│     Frozen timestamp recorded                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### Scenario D: Deadline Notification & Extension

**Context:** 決策期限到期，系統提醒使用者要延長期限或凍結決策。

**User Flow:**

```
┌─────────────────────────────────────────────────────────────────┐
│  Flow 4: Deadline Notification                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Decision deadline reached                                  │
│              │                                                  │
│              ▼                                                  │
│  2. Notification appears in notification page                  │
│     ┌─────────────────────────────────────────────┐             │
│     │ Deadline reached                            │             │
│     │ Choose one:                                 │             │
│     │ • Freeze decision now                       │             │
│     │ • Extend deadline (reason required)         │             │
│     └─────────────────────────────────────────────┘             │
│              │                                                  │
│              ▼                                                  │
│  3. If extend: enter new deadline + reason                      │
│              │                                                  │
│              ▼                                                  │
│  4. System updates deadline and records reason                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### Scenario E: Post-Decision Review

**Context:** 三個月後，使用者想回顧這個決策的結果。

**User Flow:**

```
┌─────────────────────────────────────────────────────────────────┐
│  Flow 5: Add Review                                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Open decision (Status: ACTIVE)                              │
│              │                                                  │
│              ▼                                                  │
│  2. View frozen content (read-only)                             │
│     ┌─────────────────────────────────────────────┐             │
│     │ 📋 Original hypotheses & confidence         │             │
│     │ H1: New role will offer more growth (75%)   │             │
│     │ H2: Team culture is better (65%)            │             │
│     │ H3: Compensation offsets risk (60%)         │             │
│     └─────────────────────────────────────────────┘             │
│              │                                                  │
│              ▼                                                  │
│  3. Click "Add Review"                                          │
│              │                                                  │
│              ▼                                                  │
│  4. Fill review form                                            │
│     ┌─────────────────────────────────────────────┐             │
│     │ Actual Outcome:                             │             │
│     │ "Role is engaging, but growth slower than   │             │
│     │  expected. Team culture is excellent."      │             │
│     │                                             │             │
│     │ Hypothesis Assessment:                      │             │
│     │ H1 (75%): Partially confirmed ○             │             │
│     │ H2 (65%): Strongly confirmed ●              │             │
│     │ H3 (60%): Too early to tell ◐              │             │
│     │                                             │             │
│     │ Lessons Learned:                            │             │
│     │ "I overweighted growth potential, under-    │             │
│     │  weighted culture fit in past decisions."   │             │
│     └─────────────────────────────────────────────┘             │
│              │                                                  │
│              ▼                                                  │
│  5. Save review                                                 │
│     (Can add more reviews later)                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### Scenario F: Reconsider After New Evidence

**Context:** 使用者在做出選擇後出現新證據，想改變選擇但保留原決策快照。

**User Flow:**

```
┌─────────────────────────────────────────────────────────────────┐
│  Flow 6: Reconsider Decision                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Open decision (Status: ACTIVE or CLOSED)                    │
│              │                                                  │
│              ▼                                                  │
│  2. Review frozen content & new evidence                        │
│     (ACTIVE can add evidence; CLOSED cannot add evidence)       │
│              │                                                  │
│              ▼                                                  │
│  3. Click "Reconsider"                                          │
│              │                                                  │
│              ▼                                                  │
│  4. Provide reconsider reason & new deadline                    │
│     "New data contradicts assumption H2"                        │
│              │                                                  │
│              ▼                                                  │
│  5. System creates a new decision (Status: DRAFT)               │
│     Copies content and evidence; links to original              │
│              │                                                  │
│              ▼                                                  │
│  6. User updates the new draft and proceeds later               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### Scenario G: Cross-Decision Patterns

**Context:** 使用者想看自己過去一年的決策模式。

**User Flow:**

```
┌─────────────────────────────────────────────────────────────────┐
│  Flow 7: Pattern Review                                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Navigate to "Decision History"                              │
│              │                                                  │
│              ▼                                                  │
│  2. View all decisions with reviews                             │
│     ┌─────────────────────────────────────────────┐             │
│     │ Filter: [All] [By Category] [By Outcome]    │             │
│     │                                             │             │
│     │ ✓ Job decision - 3 months ago              │             │
│     │ ✓ Tech stack choice - 6 months ago         │             │
│     │ ✓ Investment decision - 8 months ago       │             │
│     │ ○ Side project scope - pending review       │             │
│     └─────────────────────────────────────────────┘             │
│              │                                                  │
│              ▼                                                  │
│  3. View aggregated insights                                    │
│     ┌─────────────────────────────────────────────┐             │
│     │ 📊 Your Decision Patterns                   │             │
│     │                                             │             │
│     │ Hypotheses by outcome:                      │             │
│     │ • High confidence (>70%) that were wrong: 3 │             │
│     │ • Low confidence (<40%) that were right: 5  │             │
│     │                                             │             │
│     │ Common themes in lessons:                   │             │
│     │ • "Underestimated timeline" (4 decisions)   │             │
│     │ • "Overweighted initial enthusiasm"         │             │
│     └─────────────────────────────────────────────┘             │
│              │                                                  │
│              ▼                                                  │
│  4. Self-reflection (no system scoring)                         │
│     User draws own conclusions from data                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Core Use Cases

### UC-01: Create Decision

| Attribute     | Value                                                                                                                                                                                                                                                                           |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Actor         | Authenticated User                                                                                                                                                                                                                                                              |
| Precondition  | User is logged in                                                                                                                                                                                                                                                               |
| Trigger       | User clicks "New Decision"                                                                                                                                                                                                                                                      |
| Main Flow     | 1. System displays empty decision form<br>2. User enters title (required)<br>3. User enters description/context<br>4. User adds hypotheses with confidence (0-100%)<br>5. User defines expected outcomes<br>6. User sets decision deadline (required)<br>7. User saves decision |
| Postcondition | Decision created with status DRAFT                                                                                                                                                                                                                                              |
| Validation    | Title is required, max 200 chars<br>Decision deadline is required and must be in the future<br>At least one hypothesis recommended                                                                                                                                              |

### UC-02: Edit Draft Decision

| Attribute     | Value                                                                                                                                          |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Actor         | Decision Owner                                                                                                                                 |
| Precondition  | Decision exists with status DRAFT                                                                                                              |
| Trigger       | User opens decision and edits                                                                                                                  |
| Main Flow     | 1. User modifies any field (including decision deadline)<br>2. If deadline changes, user provides reason<br>3. System records change with timestamp<br>4. Previous values preserved in history |
| Postcondition | Decision updated, history preserved                                                                                                            |
| Constraint    | Not allowed if status ≠ DRAFT or decision deadline has passed (except Extend Deadline)                                                         |

### UC-03: Add Evidence

| Attribute     | Value                                                                                                                                       |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Actor         | Decision Owner                                                                                                                              |
| Precondition  | Decision status is DRAFT (before decision deadline) or ACTIVE                                                                               |
| Trigger       | User clicks "Add Evidence"                                                                                                                  |
| Main Flow     | 1. User enters evidence (link, note, file reference)<br>2. User optionally links to specific hypothesis<br>3. System records with timestamp |
| Postcondition | Evidence appended (never overwrites)                                                                                                        |
| Note          | Evidence can be added even after freeze, but not after close; in DRAFT it is only allowed before deadline                                   |

### UC-04: Adjust Confidence

| Attribute     | Value                                                                                                                                          |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Actor         | Decision Owner                                                                                                                                 |
| Precondition  | Decision status is DRAFT and before decision deadline                                                                                          |
| Trigger       | User changes confidence value                                                                                                                  |
| Main Flow     | 1. User selects hypothesis<br>2. User enters new confidence (0-100%)<br>3. User provides reason for change<br>4. System records as new version |
| Postcondition | New confidence recorded, old value in history                                                                                                  |
| Constraint    | Not allowed after freeze or after decision deadline                                                                                            |

### UC-05: Freeze Decision

| Attribute       | Value                                                                                                                                                                                     |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Actor           | Decision Owner                                                                                                                                                                            |
| Precondition    | Decision status is DRAFT                                                                                                                                                                  |
| Trigger         | User clicks "Freeze Decision"                                                                                                                                                             |
| Main Flow       | 1. System shows confirmation with implications<br>2. User confirms<br>3. User optionally records final choice<br>4. System changes status to ACTIVE<br>5. System records freeze timestamp |
| Postcondition   | Decision frozen, content immutable                                                                                                                                                        |
| Irreversibility | Cannot unfreeze                                                                                                                                                                           |
| Note            | If decision deadline has passed, user must freeze before further edits                                                                                                                    |

### UC-06: Add Review

| Attribute     | Value                                                                                                                                                                                     |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Actor         | Decision Owner                                                                                                                                                                            |
| Precondition  | Decision status is ACTIVE or CLOSED                                                                                                                                                       |
| Trigger       | User clicks "Add Review"                                                                                                                                                                  |
| Main Flow     | 1. User views original (frozen) content<br>2. User records actual outcome<br>3. User assesses each hypothesis<br>4. User records lessons learned<br>5. System saves review with timestamp |
| Postcondition | Review added to decision                                                                                                                                                                  |
| Note          | Multiple reviews allowed over time                                                                                                                                                        |

### UC-07: View Decision History

| Attribute     | Value                                                                                                        |
| ------------- | ------------------------------------------------------------------------------------------------------------ |
| Actor         | Decision Owner                                                                                               |
| Precondition  | Decision exists                                                                                              |
| Trigger       | User clicks "View History"                                                                                   |
| Main Flow     | 1. System displays timeline of all changes<br>2. User can see any past state<br>3. User can compare versions |
| Postcondition | None (read-only)                                                                                             |
| Note          | History includes deadline changes and extension reasons                                                      |

### UC-08: Close Decision

| Attribute     | Value                                                                     |
| ------------- | ------------------------------------------------------------------------- |
| Actor         | Decision Owner                                                            |
| Precondition  | Decision status is ACTIVE                                                 |
| Trigger       | User clicks "Close Decision"                                              |
| Main Flow     | 1. User marks decision as concluded<br>2. System changes status to CLOSED |
| Postcondition | Decision archived, still viewable                                         |
| Note          | Can still add reviews after closing                                       |

### UC-09: Reconsider Decision

| Attribute     | Value                                                                                                                                                                                                                                                               |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Actor         | Decision Owner                                                                                                                                                                                                                                                      |
| Precondition  | Decision status is ACTIVE or CLOSED                                                                                                                                                                                                                                 |
| Trigger       | User clicks "Reconsider"                                                                                                                                                                                                                                            |
| Main Flow     | 1. System shows frozen content and existing evidence (read-only)<br>2. User provides reconsider reason<br>3. User sets new decision deadline<br>4. System creates new decision in DRAFT by copying content and evidence<br>5. System links new decision to original |
| Postcondition | New decision created; original decision remains unchanged                                                                                                                                                                                                           |
| Note          | New decision can be edited and frozen independently                                                                                                                                                                                                                 |

### UC-10: Extend Decision Deadline

| Attribute     | Value                                                                                                                                                                                                                                          |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Actor         | Decision Owner                                                                                                                                                                                                                                 |
| Precondition  | Decision status is DRAFT                                                                                                                                                                                                                       |
| Trigger       | User selects "Extend deadline" (from decision page or notification page)                                                                                                                                  |
| Main Flow     | 1. User selects Extend<br>2. User enters new deadline and reason<br>3. System validates new deadline is in the future<br>4. System updates deadline and records reason in history |
| Postcondition | Deadline extended; decision remains DRAFT                                                                                                                                                                                                      |
| Constraint    | Reason is required for every extension                                                                                                                                                                                                         |
| Note          | Can be used before deadline; if deadline has passed, other edits remain blocked until the user extends the deadline or freezes the decision                                                                                                        |

---

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

## Data Model (Conceptual)

```
┌─────────────────────────────────────────────────────────────────┐
│                         User                                    │
├─────────────────────────────────────────────────────────────────┤
│ id: UUID (PK)                                                   │
│ email: string (unique)                                          │
│ name: string                                                    │
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

## Product Principles

### 1. Immutable History 不可改寫歷史

> 凍結後的內容是神聖的。系統設計的首要目標是防止事後美化。

**Implementation:**

- DRAFT 狀態下的編輯會創建新版本，不覆蓋舊值
- 凍結後，核心欄位變為 read-only
- 重大改變透過 Reconsider 建立新決策，不回寫原決策
- Deadline 延長需填寫原因並寫入歷史（每次）
- 資料庫層面不提供 UPDATE 凍結內容的 API

### 2. Low-Friction Recording 低摩擦記錄

> 記錄應該比寫長文更輕量，否則使用者不會持續使用。

**Implementation:**

- 只有 title 是必填
- 假設可以先列點，之後補細節
- 支援漸進式完善（先 draft，慢慢補充）

### 3. No Value Judgment 不做價值判斷

> 系統不評斷決策好壞，只保存事實。評價是使用者自己的事。

**Implementation:**

- 沒有「決策評分」功能
- Hypothesis Assessment 由使用者自行判定
- Pattern Review 只呈現數據，不給建議

### 4. Retrospection Over Real-time 支援回顧，而非即時指導

> 價值來自時間差。系統不在決策當下給建議，而是幫助未來回顧。

**Implementation:**

- 不提供「這個決定好不好」的即時反饋
- 重點功能是凍結和回顧
- Review 功能鼓勵在時間過後回來

### 5. Time-Boxed Decisions 有截止時間

> 沒有期限就很難做出決定。每個決策必須有時間界線。

**Implementation:**

- `decision_deadline` 為必填欄位
- Extend Deadline 可在 DRAFT 任何時間使用，且每次需填寫原因
- deadline 到期後，DRAFT 僅能 Freeze 或 Extend Deadline
- UI 顯示倒數與逾期提醒

---

## Success Metrics

### Primary Metrics (MVP)

| Metric              | Definition                                   | Target |
| ------------------- | -------------------------------------------- | ------ |
| Freeze Rate         | % of decisions that get frozen               | > 60%  |
| Review Rate         | % of frozen decisions with at least 1 review | > 40%  |
| Hypothesis Richness | Avg hypotheses per decision                  | ≥ 2    |
| Return Usage        | Users who add review after 7+ days           | > 30%  |

### Secondary Metrics

| Metric                 | Definition                                  | Signal             |
| ---------------------- | ------------------------------------------- | ------------------ |
| Draft Completion       | % of started decisions that reach freeze    | Usability          |
| Confidence Adjustments | Avg adjustments per decision before freeze  | Engagement         |
| Review Depth           | Avg words in lessons learned                | Reflection quality |
| Pattern View Usage     | % of users who use cross-decision view      | Feature value      |
| Deadline Compliance    | % of decisions frozen by deadline           | Commitment         |
| Reconsider Rate        | % of frozen decisions that are reconsidered | Learning loop      |

### Anti-Metrics (What NOT to Optimize)

- ❌ Decision count（多不代表好）
- ❌ Time spent in app（不是 engagement 型產品）
- ❌ Decision success rate（不是系統要管的事）

---

## MVP Scope (4-Week Target)

### Week 1-2: Core Decision Flow

- [ ] **Authentication** (basic email/password)
- [ ] **UC-01**: Create Decision
- [ ] **UC-02**: Edit Draft Decision
- [ ] **UC-04**: Adjust Confidence (with history)
- [ ] **UC-05**: Freeze Decision
- [ ] Decision deadline field + validation
- [ ] **UC-10**: Extend Decision Deadline (with reason)
- [ ] Deadline notification (at deadline)
- [ ] Basic decision list view

### Week 3: Review & History

- [ ] **UC-06**: Add Review
- [ ] **UC-07**: View Decision History
- [ ] **UC-03**: Add Evidence
- [ ] **UC-08**: Close Decision

### Week 4: Polish & Patterns

- [ ] **Flow 7**: Cross-decision view (simplified)
- [ ] Category/tagging system
- [ ] **UC-09**: Reconsider Decision
- [ ] UI polish and responsive design
- [ ] Bug fixes and edge cases

### Deferred to V1.1

- AI-assisted pattern detection
- Export/backup functionality
- Advanced filtering and search
- Reminder notifications for reviews
- Dark mode

---

## Technical Architecture (High-Level)

### Stack

| Layer    | Technology      | Rationale                                   |
| -------- | --------------- | ------------------------------------------- |
| Frontend | TanStack Start  | Modern full-stack React framework           |
| API      | Express.js      | Flexible, well-known Node.js framework      |
| Database | PostgreSQL      | ACID compliance for immutability guarantees |
| Monorepo | pnpm workspaces | Efficient dependency management             |

### Package Structure

```
decisioner/
├── apps/
│   ├── web/              # TanStack Start frontend
│   └── api/              # Express.js backend
├── packages/
│   ├── database/         # Prisma/Drizzle schema, migrations
│   ├── shared/           # Shared types, validation schemas
│   └── ui/               # Shared UI components (optional)
├── package.json
├── pnpm-workspace.yaml
└── turbo.json            # Turborepo config
```

### Key Technical Decisions

1. **Immutability at DB level**
   - Use soft deletes and append-only patterns
   - Audit trail via created_at timestamps
   - No UPDATE on frozen records (enforce in API)

2. **Confidence History**
   - Separate table for snapshots
   - Current confidence = latest snapshot
   - Full history queryable

3. **API Design**
   - REST endpoints for CRUD
   - Decision-centric resource hierarchy
   - Proper status code usage (409 for invalid state transitions)

---

## Open Questions

| Question          | Options                       | Decision Needed By |
| ----------------- | ----------------------------- | ------------------ |
| Auth provider?    | DIY, Lucia, Clerk, Auth.js    | Week 1             |
| ORM choice?       | Prisma, Drizzle               | Week 1             |
| Deploy target?    | Vercel, Railway, VPS          | Week 3             |
| Hypothesis order? | User-defined vs chronological | Week 2             |

---

## Risks & Mitigations

| Risk                           | Likelihood | Impact | Mitigation                           |
| ------------------------------ | ---------- | ------ | ------------------------------------ |
| Users don't return for reviews | Medium     | High   | Add optional reminder system in V1.1 |
| Recording feels too heavy      | Medium     | High   | Start with minimal required fields   |
| Freeze feels too permanent     | Low        | Medium | Clear confirmation UX, show benefits |
| History view too complex       | Medium     | Medium | Simple timeline first, enhance later |

---

## Appendix: Example Decision

**Title:** Should I learn Rust in 2024?

**Description:** Considering investing 2-3 months to learn Rust for systems programming.

**Context:** Current stack is TypeScript. Interested in performance-critical code. Rust jobs increasing.

**Hypotheses:**

1. Learning Rust will make me better at memory management (Confidence: 80%)
2. I can ship a side project in Rust within 3 months (Confidence: 45%)
3. Rust knowledge will be relevant to my career in 2 years (Confidence: 60%)

**Expected Outcome:** If I learn Rust:

- Should be able to understand systems-level code
- Might contribute to a Rust OSS project
- Better mental model for performance

**Final Choice (on freeze):** Yes, will start with Rustlings

**Review (6 months later):**

- Outcome: Completed Rustlings, built a CLI tool. Did not ship side project.
- H1: Confirmed - much better understanding of ownership
- H2: Wrong - took 5 months and still not "shipped"
- H3: Too early to tell
- Lesson: I consistently underestimate learning curves for new paradigms

---

## Revision History

| Version | Date       | Author | Changes     |
| ------- | ---------- | ------ | ----------- |
| 1.0.0   | 2026-02-05 | -      | Initial PRD |
