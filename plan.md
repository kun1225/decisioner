# G-02 PR-4 Implementation Plan

## Scope

- Goal: 完成 `docs/prd/goals/g-02.md` 的 `PR-4 refactor(api): template ordering and edit consistency`
- Branch: `feat/g02-pr4-template-ordering-edit-consistency`
- Source of truth:
  - `docs/prd/goals/g-02.md`
  - `docs/specs/5-api-design.md` §5.6
  - `docs/specs/6-data-model.md` §6.3

## Current State

- 現有 template item CRUD 已完成，但 `sortOrder` 仍由 client 直接指定。
- `apps/api/src/modules/templates/template.service.ts` 目前採用「撞號即回 409」的模式，尚未做 transaction-based reorder。
- `packages/database/src/schema/template.ts` 尚未對 `template_items(template_id, sort_order)` 宣告唯一性約束，與 `docs/specs/6-data-model.md` 不一致。
- `packages/shared/src/templates.ts` 的 payload 仍偏向基礎 CRUD，尚未充分對齊未來 editor 的操作語意。
- `apps/api/src/modules/templates/template.service.test.ts` 目前覆蓋一般 CRUD 與衝突情境，但缺少 ordering、reorder、delete consistency 的測試。

## Implementation Strategy

### Phase 1: Align Contract And Constraints

1. 先定義 editor 需要的 ordering 語意，避免 service 重構後又回頭改 schema。
2. 更新 `packages/shared/src/templates.ts`：
   - `addTemplateItemSchema` 改成支援「插入位置」語意，而不是單純暴露裸 `sortOrder`
   /* REVIEW: 「插入位置」的具體 schema shape 沒有定義。需要明確決定欄位設計，例如：
      - 方案 A: `position?: number`（0-based index，省略 = append to end）
      - 方案 B: `afterItemId?: string`（插入在某 item 之後）
      不同方案會顯著影響 service 的排序邏輯，應在此階段就明確選定，而非留到實作時才決定。*/
   - `updateTemplateItemSchema` 明確區分內容更新與 reorder 更新
   /* REVIEW: 同上，reorder 的欄位設計也需要具體化。是沿用同一個 `position` 欄位？
      還是用 `newPosition` / `moveTo`？且需釐清：content 更新（note）和 reorder
      能否在同一次 request 中同時進行？若不行，是用 union schema 分開還是用 refine 互斥？*/
   - 視需求補上更貼近 editor 的欄位命名或 union schema
3. 更新 `packages/shared/src/templates.test.ts`，先寫 schema 測試確認新 payload 規則。
4. 在 `packages/database/src/schema/template.ts` 為 `template_items` 加上 `(templateId, sortOrder)` unique constraint。
5. 產出對應 migration，讓 DB 層先保證 invariant。
   /* REVIEW: migration 需要包含資料修正步驟。若現有資料中同一 template 已有重複或不連續的
      sortOrder，直接加 unique constraint 會導致 migration 失敗。建議明確寫出：
      migration 先跑一段 SQL 將既有 template_items 按 sort_order 重新編號為連續序列，
      再加 unique constraint。不能只靠「檢查」，要在 migration 本身保證冪等。*/

### Phase 2: Refactor Service To Server-Managed Ordering

/* REVIEW: Phase 編號暗示 Phase 2 在 Phase 4 (TDD) 之前執行，但下方 TDD Flow 和
   Suggested Execution Order 都要求「先寫 service tests → 再改 service」。
   建議把 Phase 結構改為依執行順序排列，或明確標注 Phase 只是主題分類而非執行順序，
   避免讀者誤認為按 1→2→3→4 線性執行。*/

1. 在 `apps/api/src/modules/templates/template.service.ts` 抽出排序輔助流程：
   - 讀取 template item 當前序列
   - 正規化插入/移動目標 index
   - 重新編排整份 template 的 `sortOrder`
2. `addTemplateItem` 改為：
   - 驗證 template owner 與 exercise access
   - 由 server 依插入位置決定排序
   - 在 transaction 內完成「位移既有項目 + 建立新 item」
3. `updateTemplateItem` 改為：
   - 支援 note/content 更新
   - 若帶 reorder 欄位，於 transaction 內完成整體重排
   - 避免只更新單筆導致中間態 sortOrder 衝突
4. `deleteTemplateItem` 改為：
   - 刪除目標 item
   - 將後續項目補齊排序，確保刪除後仍為連續序列
   /* REVIEW: delete + reorder 也需要包在 transaction 內，但這裡沒有提到。
      應與 add/update 一樣明確標注 transaction 邊界。*/
5. `getTemplateById` 維持依 `sortOrder asc` 回傳，讓 editor 與後續 start workout 讀到一致資料。

### Phase 3: Controller And Route Compatibility Check

1. 檢查 `apps/api/src/modules/templates/template.controller.ts` 是否只需換 schema parse 即可。
2. 若 payload 變更會影響 response shape，先維持 endpoint 路徑不變，避免擴大到 PR-5。
3. 確認錯誤語意：
   - 非法位置或不存在 item 回 4xx
   - 權限與 exercise access 行為不回歸
   /* REVIEW: spec §5.6 point 4 說「Conflicting or invalid ordering writes must be rejected
      with a 4xx error」。在 server-managed ordering 模型下，需要定義「invalid」的邊界——
      例如 position < 0 或 position > items.length 是回 400 還是自動 clamp？
      建議在此明確：超出合法範圍 → 400，而非靜默修正。*/

### Phase 4: TDD And Regression Coverage

1. 先補 `template.service.test.ts` 的失敗案例，再改 service。
2. 必測案例：
   - add item 插入中間時，後續項目自動後移
   - update item reorder 從前移後、從後移前
   - delete item 後，剩餘項目自動補齊連號
   - reorder / delete 後 `getTemplateById` 回傳順序正確
   - 非 owner、template 不存在、item 不存在、exercise 不可存取仍正確報錯
   /* REVIEW: 缺少邊界案例：
      - add item 不指定 position（append to end）
      - add item position = 0（插入最前面）
      - position 超出範圍時回 400
      - template 為空時的首次 add
      - reorder 到原位（position 不變，應為 no-op）*/
3. 若目前 mock DB 形狀不利於 transaction 測試，優先重構 test doubles，而不是放棄 transaction 行為驗證。

## TDD Flow

/* REVIEW: 這個 section 與下方 Suggested Execution Order 內容高度重複，
   建議合併為一個 section，避免未來修改時兩邊不同步。*/

1. 在 shared schema tests 先寫新的 payload 驗證規則，確認 RED。
2. 在 service tests 補 ordering / reorder / delete consistency 測試，確認 RED。
3. 新增 DB schema constraint 與 migration。
4. 以最小修改重構 service 讓測試轉綠。
5. 清理重複邏輯，抽出排序 helper，保持測試全綠。
6. 跑 template 相關測試與型別檢查，確認沒有 contract 回歸。

## Risks And Decisions

- 風險 1: 目前 service test 使用淺層 mock，可能無法真實表達 transaction 行為。
  - Decision: 若需要，重構 mock 以模擬 transaction 邊界與多步更新。
  /* REVIEW: 「若需要」太模糊。看過現有 mock（template.service.test.ts），
     它完全沒有 `db.transaction()` 的模擬能力——全域 selectResult/insertResult/updateResult
     無法表達 transaction 回呼內使用 `tx` 而非 `db` 的 Drizzle 模式。
     既然 service 必須用 transaction（spec §5.6 point 3），mock 重構就是必要前提，
     不是「若需要」而是「必須」。建議改為：
     Decision: 重構 mock 以支援 `db.transaction(async (tx) => ...)` 模式，
     使 test doubles 可驗證 transaction 內的多步更新行為。*/
- 風險 2: 「editor 需求」在 PR-5 才真正落地，PR-4 需避免過度設計。
  - Decision: payload 只做最小必要對齊，聚焦插入位置與 reorder 語意。
- 風險 3: 新增 unique constraint 前，若已有髒資料會造成 migration 失敗。
  - Decision: 先檢查現行測試資料與 seed 是否可能產生重複 `sortOrder`，必要時在 migration 前做資料修正。

/* REVIEW: 缺少一個風險：PR 規模。CLAUDE.md 要求每個 PR 不超過 500 changed lines。
   這次涉及 shared schema + schema test + DB schema + migration + service 重構 +
   service test 重構 + controller 微調，很可能超過 500 行。
   建議加上風險 4 並提出應對策略（例如：若超過，將 mock 重構 + test 拆為獨立 commit，
   或將 migration 與 service 變更分成兩個 PR）。*/

## File Targets

- `packages/shared/src/templates.ts`
- `packages/shared/src/templates.test.ts`
- `packages/database/src/schema/template.ts`
- `packages/database/drizzle/*`
- `apps/api/src/modules/templates/template.service.ts`
- `apps/api/src/modules/templates/template.service.test.ts`
- `apps/api/src/modules/templates/template.controller.ts`

## Verification Checklist

- [ ] `template_items(template_id, sort_order)` unique constraint 已進入 schema 與 migration
- [ ] add / reorder / delete 全由 server 維護排序
- [ ] 同一 template 內 `sortOrder` 唯一且連續
- [ ] template detail 仍按 `sortOrder` 回傳
- [ ] template service tests 覆蓋 ordering、reorder、delete consistency
- [ ] shared schema tests 覆蓋新 payload 規則
- [ ] 相關測試與 typecheck 通過

## Suggested Execution Order

1. 改 shared schema 與 schema tests
2. 補 service tests（先寫失敗案例）
3. 加 DB unique constraint 與 migration
4. 重構 template service 的 ordering 流程
5. 視需要微調 controller parse
6. 跑測試與整理 commit
