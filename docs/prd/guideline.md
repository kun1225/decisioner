# PRD Guideline

## Rules

1. `docs/PRD.md` 是 PRD 入口。
2. 詳細內容維護在 `docs/prd/*.md` 與 `docs/prd/goals/*.md`。
3. 每個 goal 檔案需包含：`Goal Statement`、`Requirement`、`In Scope`、`Out Scope`、`Acceptance Criteria`。
4. 每個 Goal 檔案採單一責任（one goal, one requirement）。
5. `Acceptance Criteria` 使用 Given/When/Then 描述；進度使用 `[ ]` 與 `[x]`。
6. 修改需求時需同步更新對應的 spec 與 `docs/TODO.md`。
7. 若與 spec 衝突，依 `docs/DOCUMENTATION-CONTRACT.md` 的優先順序處理。
