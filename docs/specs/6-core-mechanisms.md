# 6. Core Mechanisms

## 6.1 Freeze Mechanism

**Purpose:** 鎖定決策當下的狀態，防止事後修改。

**Implementation:**

```typescript
// decision.service.ts
async freeze(id: string, input: FreezeDecisionInput) {
  return await db.transaction(async (tx) => {
    // 1. Update decision status
    const [updated] = await tx
      .update(decisions)
      .set({
        status: "ACTIVE",
        finalChoice: input.finalChoice,
        frozenAt: new Date(),
      })
      .where(eq(decisions.id, id))
      .returning();

    // 2. Get all hypotheses
    const hypothesisList = await tx
      .select()
      .from(hypotheses)
      .where(eq(hypotheses.decisionId, id));

    // 3. Mark latest confidence snapshot as frozen
    for (const h of hypothesisList) {
      const [latestSnapshot] = await tx
        .select()
        .from(confidenceSnapshots)
        .where(eq(confidenceSnapshots.hypothesisId, h.id))
        .orderBy(desc(confidenceSnapshots.createdAt))
        .limit(1);

      if (latestSnapshot) {
        await tx
          .update(confidenceSnapshots)
          .set({ isFrozen: true })
          .where(eq(confidenceSnapshots.id, latestSnapshot.id));
      }
    }

    return updated;
  });
}
```

**Key Points:**

- 使用 transaction 確保原子性
- 每個 hypothesis 的最新 confidence snapshot 會被標記為 `is_frozen: true`
- `frozen_at` timestamp 記錄凍結時間

---

## 6.2 Confidence History (Append-Only)

**Purpose:** 保留所有信心值變更的歷史記錄。

**Pattern:** 永遠 INSERT 新的 snapshot，不 UPDATE 既有記錄。

```typescript
// hypothesis.service.ts
async adjustConfidence(hypothesisId: string, input: UpdateConfidenceInput) {
  // Always INSERT new row, never UPDATE
  const [snapshot] = await db
    .insert(confidenceSnapshots)
    .values({
      hypothesisId,
      confidence: input.confidence,
      reason: input.reason,  // Required: why the change?
    })
    .returning();

  return snapshot;
}

// Get current confidence (latest snapshot)
async getCurrentConfidence(hypothesisId: string) {
  const [latest] = await db
    .select()
    .from(confidenceSnapshots)
    .where(eq(confidenceSnapshots.hypothesisId, hypothesisId))
    .orderBy(desc(confidenceSnapshots.createdAt))
    .limit(1);

  return latest?.confidence ?? null;
}

// Get full history
async getConfidenceHistory(hypothesisId: string) {
  return await db
    .select()
    .from(confidenceSnapshots)
    .where(eq(confidenceSnapshots.hypothesisId, hypothesisId))
    .orderBy(asc(confidenceSnapshots.createdAt));
}
```

**Key Points:**

- 當前信心值 = 最新的 snapshot
- 歷史查詢按 `created_at` 排序
- `is_frozen` 標記凍結時刻的值（用於顯示「凍結時的信心」）

---

## 6.3 State Validation Middleware

**Purpose:** 在 API 層阻擋非法的狀態操作。

```typescript
// In controller
async update(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const decision = await decisionService.findById(id);

    // 1. Check existence
    if (!decision) {
      throw new ApiError(404, "Decision not found");
    }

    // 2. Check ownership
    if (decision.userId !== req.user!.id) {
      throw new ApiError(403, "Not authorized");
    }

    // 3. Check state constraint
    if (decision.status !== "DRAFT") {
      throw new ApiError(409, "Cannot edit frozen decision");
    }

    // Proceed with update...
    const input = updateDecisionSchema.parse(req.body);
    const updated = await decisionService.update(id, input);
    res.json({ data: updated });
  } catch (error) {
    next(error);
  }
}
```

**Error Response for Invalid State:**

```json
{
  "error": {
    "code": 409,
    "message": "Cannot edit frozen decision"
  }
}
```

---

## 6.4 Multi-tenancy (User Isolation)

**Purpose:** 確保使用者只能存取自己的資料。

**Implementation Layers:**

1. **Query Level:** 所有查詢都包含 `user_id` 條件

```typescript
async findAllByUser(userId: string) {
  return await db
    .select()
    .from(decisions)
    .where(eq(decisions.userId, userId))
    .orderBy(desc(decisions.createdAt));
}
```

2. **Middleware Level:** 驗證資源擁有權

```typescript
// ownership.middleware.ts
export async function checkDecisionOwnership(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { id } = req.params
  const decision = await decisionService.findById(id)

  if (!decision) {
    throw new ApiError(404, 'Decision not found')
  }

  if (decision.userId !== req.user!.id) {
    throw new ApiError(403, 'Not authorized')
  }

  req.decision = decision
  next()
}
```
