# G-02 PR-4 Implementation Plan

## Scope

- Goal: 完成 `docs/prd/goals/g-02.md` 的 `PR-4 refactor(api): template ordering and edit consistency`
- Branch: `feat/g02-pr4-template-ordering-edit-consistency`
- Source of truth:
  - `docs/prd/goals/g-02.md`
  - `docs/specs/5-api-design.md` §5.6
  - `docs/specs/6-data-model.md` §6.3

## Current State

- PR-4 核心實作已完成：template item ordering 已改由 server 端 transaction 維護。
- `packages/shared/src/templates.ts` 已改成 `position` 語意，並拒絕舊的 `sortOrder` payload。
- `packages/database/src/schema/template.ts` 與 drizzle migration 已補上 `template_items(template_id, sort_order)` unique constraint，且 migration 會先做資料正規化。
- `apps/api/src/modules/templates/template.service.ts` 已實作 add / reorder / delete consistency，並將 DB unique violation 轉成 `409` API error。
- `apps/api/src/modules/templates/template.service.test.ts` 目前已覆蓋 ordering、reorder、delete consistency、constraint collision 與 rollback 模擬，但測試檔明顯偏大，後續需要由 integration tests 承接 DB invariant 驗證。

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

- [x] `template_items(template_id, sort_order)` unique constraint 已進入 schema 與 migration
- [x] add / reorder / delete 全由 server 維護排序
- [x] 同一 template 內 `sortOrder` 唯一且連續
- [x] 非法 `position` 會被拒絕並回 400
- [x] template detail 仍按 `sortOrder` 回傳
- [x] template service tests 覆蓋 ordering、reorder、delete consistency
- [x] shared schema tests 覆蓋新 payload 規則
- [x] 相關測試與 typecheck 通過

## Next Step: Option B

### Goal

- 導入 template integration tests，讓真 DB 驗證 transaction、unique constraint、rollback 與 API error mapping。
- 將目前過重的 `template.service.test.ts` 收斂為較薄的 service unit tests，把 DB invariant 驗證責任轉移到 integration layer。

### Why This Path

- repo 已有 integration test 基礎設施，後續擴充 template 線的成本低於長期維護一份大型 fake DB 測試。
- `template.service.test.ts` 目前為了驗證 ordering invariant，內含 stateful fake DB 與 transaction/rollback 模擬，維護成本偏高。
- PR-4 的真正風險點是 DB constraint 與 transaction 行為；這些用 integration tests 驗證更可信。

### Follow-up Steps

1. 建立 `apps/api/src/modules/templates/template.integration.test.ts`。
2. 參考既有 integration test setup，接上測試 DB、auth helper 與 API app instance。
3. 補 template ordering 關鍵整合案例：
   - add item append to end
   - add item insert at position
   - reorder item forward/backward
   - delete item 後 compact `sortOrder`
   - invalid position 回 400
   - concurrent/conflicting ordering write 回 409
4. 用真 DB 驗證 runtime 下的 unique constraint 與 transaction rollback 行為。
5. 另外補一個 migration 驗證工作，確認既有髒資料的 sortOrder 正規化路徑正確。
6. 收斂 `apps/api/src/modules/templates/template.service.test.ts`：
   - 移除重型 fake DB invariant 驗證
   - 保留純 service-level 決策與錯誤分流測試
7. 若有共用 setup / helper，抽到 template 測試專用 helper，避免 integration 與 unit test 各自複製。

### Atomic Commit Plan

1. `test: add template integration coverage for ordering flows`
2. `test: verify template ordering migration normalization`
3. `refactor: slim template service unit tests`

### Verification For Option B

- [ ] `template.integration.test.ts` 可在真 DB 下驗證 ordering invariant
- [ ] conflict / rollback / unique constraint 由 integration tests 承接
- [ ] migration 正規化路徑有獨立驗證
- [ ] `template.service.test.ts` 行數明顯下降且仍保留高價值 unit coverage
- [ ] template API 相關 unit + integration tests 通過
