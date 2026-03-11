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

### Step 1: Define Contract And Constraints

1. 先定義 editor 需要的 ordering 語意，避免 service 重構後又回頭改 schema。
2. 更新 `packages/shared/src/templates.ts`：
   - `addTemplateItemSchema` 改為 `exerciseId + position? + note?`
   - `position` 採 0-based index；省略時代表 append to end
   - `updateTemplateItemSchema` 改為單一 schema：`note? + position?`
   - 同一次 request 允許同時更新 `note` 與 `position`，避免 editor 需要拆成兩次呼叫
   - `position` 若存在，代表 move target index，而不是沿用舊的 `sortOrder` 語意
3. 更新 `packages/shared/src/templates.test.ts`，先寫 schema 測試確認新 payload 規則。
4. 在 `packages/database/src/schema/template.ts` 為 `template_items` 加上 `(templateId, sortOrder)` unique constraint。
5. 產出對應 migration，讓 DB 層先保證 invariant。
   - migration 需先修正既有資料：對每個 template 依現有 `sortOrder` 與 `createdAt/id` 做穩定排序，重編成連續序列後再加 unique constraint
   - migration 本身要能處理既有重複或不連續的 `sortOrder`，不能只依賴人工檢查

### Step 2: Write Tests First

1. 先補 `packages/shared/src/templates.test.ts` 的 schema 測試，確認新 payload 規則為 RED。
2. 再補 `apps/api/src/modules/templates/template.service.test.ts` 的失敗案例。
3. 必測案例：
   - add item 不指定 `position` 時 append to end
   - add item `position = 0` 時插入最前面
   - add item 插入中間時，後續項目自動後移
   - template 為空時的首次 add
   - update item reorder 從前移後、從後移前
   - reorder 到原位時為 no-op
   - delete item 後，剩餘項目自動補齊連號
   - reorder / delete 後 `getTemplateById` 回傳順序正確
   - `position < 0` 或 `position > items.length` 時回 400
   - 非 owner、template 不存在、item 不存在、exercise 不可存取仍正確報錯
4. 重構 test doubles 以支援 `db.transaction(async (tx) => ...)` 模式，確保 transaction 內多步更新可被驗證。

### Step 3: Refactor Service To Server-Managed Ordering

1. 在 `apps/api/src/modules/templates/template.service.ts` 抽出排序輔助流程：
   - 讀取 template item 當前序列
   - 驗證 `position` 是否落在合法範圍內；超出範圍一律回 400，不做 clamp
   - 正規化插入/移動目標 index
   - 重新編排整份 template 的 `sortOrder`
2. `addTemplateItem` 改為：
   - 驗證 template owner 與 exercise access
   - 由 server 依插入位置決定排序
   - 在 transaction 內完成「位移既有項目 + 建立新 item」
3. `updateTemplateItem` 改為：
   - 支援 note/content 更新
   - 若帶 `position` 欄位，於 transaction 內完成整體重排
   - 避免只更新單筆導致中間態 `sortOrder` 衝突
4. `deleteTemplateItem` 改為：
   - 刪除目標 item
   - 將後續項目補齊排序，確保刪除後仍為連續序列
   - 整個 delete + reorder 流程需包在同一個 transaction 內
5. `getTemplateById` 維持依 `sortOrder asc` 回傳，讓 editor 與後續 start workout 讀到一致資料。

### Step 4: Controller And Route Compatibility Check

1. 檢查 `apps/api/src/modules/templates/template.controller.ts` 是否只需換 schema parse 即可。
2. 維持 endpoint 路徑與 response shape 不變，避免擴大到 PR-5。
3. 確認錯誤語意：
   - 非法位置一律回 400
   - item / template 不存在維持既有 404
   - 權限與 exercise access 行為不回歸

## Execution Order

1. 改 shared schema 與 schema tests
2. 補 service tests 與 transaction-capable test doubles
3. 加 DB unique constraint 與 migration
4. 重構 template service 的 ordering 流程
5. 視需要微調 controller parse
6. 跑測試與整理 commit

## Risks And Decisions

- 風險 1: 目前 service test 使用淺層 mock，可能無法真實表達 transaction 行為。
  - Decision: 重構 mock 以支援 `db.transaction(async (tx) => ...)` 模式，使 test doubles 可驗證 transaction 內的多步更新行為。
- 風險 2: 「editor 需求」在 PR-5 才真正落地，PR-4 需避免過度設計。
  - Decision: payload 只做最小必要對齊，聚焦插入位置與 reorder 語意。
- 風險 3: 新增 unique constraint 前，若已有髒資料會造成 migration 失敗。
  - Decision: migration 內直接做資料正規化，先修正既有 `sortOrder` 再加 unique constraint。
- 風險 4: PR 可能超過 `CLAUDE.md` 要求的 500 changed lines。
  - Decision: 優先把 schema、migration、service、tests 壓在同一個最小可交付範圍；若 diff 超標，優先考慮拆出 test/mock 重構或 migration 準備為獨立 PR。

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
- [ ] 非法 `position` 會被拒絕並回 400
- [ ] template detail 仍按 `sortOrder` 回傳
- [ ] template service tests 覆蓋 ordering、reorder、delete consistency
- [ ] shared schema tests 覆蓋新 payload 規則
- [ ] 相關測試與 typecheck 通過
