# PRD Guideline

## Rules

1. `docs/PRD.md` 是 PRD 入口。
2. 詳細內容維護在 `docs/prd/*.md` 與 `docs/prd/goals/*.md`。
3. 每個 goal 檔案需包含：`metadata header (Phase, Status, Specs)`、`Goal Statement`、`Requirement`、`In Scope`、`Out Scope`、`Frontend Elements`、`Acceptance Criteria`、`Tasks`。
4. 每個 Goal 檔案採單一責任（one goal, one requirement）。
5. `Acceptance Criteria` 使用 Given/When/Then 描述；`Tasks` 列出 PR-sized 工作項（每項 ≈ 1 PR, < 500 行）。
6. 修改需求時需同步更新 goal 檔案的 metadata 與 `goals-and-scope.md` 的狀態欄。
7. 若 goal 檔案與 spec 衝突，以 goal 檔案的 Acceptance Criteria 為需求真相來源，spec 做對應修正。
