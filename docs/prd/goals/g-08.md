# G-08 Privacy Social Limits

## Goal Statement

社交資料可控可見，且免費版有明確社交配額限制。

## Requirement

系統必須提供隱私可見性設定與 Free-Lite crew 限制。

## In Scope

1. 日期與訓練紀錄可見性分開控制
2. 預設可見性為好友可見
3. 每人最多 1 crew，每 crew 最多 2 人

## Out Scope

1. 細粒度欄位權限（逐欄位 ACL）
2. 付費社交權限分級

## Acceptance Criteria

- [ ] Given 使用者關閉訓練紀錄可見，When 好友查看，Then 只能看到允許範圍內資料。
- [ ] Given 使用者已建立 1 個 crew，When 再次建立 crew，Then 回傳 `422 FREE_TIER_LIMIT_EXCEEDED`。
