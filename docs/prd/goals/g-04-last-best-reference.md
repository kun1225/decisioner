# G-04 Last Best Reference

## Goal Statement

訓練中可即時看到同動作上次與最佳紀錄，幫助決策。

## Requirement

系統必須提供 `last` 與 `best` 查詢能力。

## In Scope

1. Last：最近一次完成 session
2. Best：最大重量優先，依 tie-break 規則排序
3. 訓練頁顯示查詢結果

## Out Scope

1. 自動建議訓練課表
2. AI 負重推薦

## Acceptance Criteria

- [ ] Given 使用者有歷史紀錄，When 開啟訓練頁某動作，Then 顯示 `last` 與 `best`。
- [ ] Given 多筆同重量紀錄，When 計算 best，Then 依 reps 與時間套用 tie-break。
