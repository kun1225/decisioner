# Documentation Contract

> Version: 1.0  
> Last Updated: 2026-02-16

## 1. Purpose

這份文件定義「每份文檔負責什麼」與「衝突時誰優先」，讓工程師、PM、AI 都用同一套基準開發。

## 2. Source Of Truth (Priority)

當內容衝突時，依照以下順序判定：

1. `docs/specs/*.md`（API、資料模型、狀態機、流程契約）
2. `docs/PRD.md`（產品目標、範圍、功能需求）
3. `docs/TODO.md`（實作順序與拆解任務）
4. `docs/ARCHITECTURE.md`（導覽與索引）

## 3. Scope Rules

1. `specs` 只寫「當前 MVP」可實作內容。
2. `MVP 2/3` 放在 `docs/TODO.md`（或 roadmap），不放進當前 MVP spec 主體。
3. Pro 功能需明確標註 `Pro`，並寫清楚授權邊界。

## 4. Document Responsibilities

1. `docs/PRD.md`
   - 定義：Why、Goals、Functional Requirements、Success Metrics。
2. `docs/specs/`
   - 定義：資料模型、API 契約、狀態機、核心機制、UX flow。
3. `docs/TODO.md`
   - 定義：按 Phase 的可執行工作項目與測試項目。
4. `docs/ARCHITECTURE.md`
   - 定義：文件索引與高層架構摘要，不放細節規格。

## 5. Update Rules

每次改需求或規格時，至少同步：

1. `PRD`（需求層）
2. 受影響的 `spec`（契約層）
3. `TODO`（執行層）

## 6. AI Working Rules

AI 開發時預設讀取順序：

1. `docs/specs/4-api-design.md`
2. `docs/specs/3-data-model.md`
3. `docs/specs/5-state-machine.md`
4. `docs/specs/6-core-mechanisms.md`
5. `docs/PRD.md`
6. `docs/TODO.md`

若發現文件衝突，依「第 2 節優先順序」處理，並先更新文件再改程式。
