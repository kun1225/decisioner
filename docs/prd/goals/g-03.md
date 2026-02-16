# G-03 Session Adjustment

## Goal Statement

使用者在訓練現場可替換/新增動作，不污染原本 template。

## Requirement

系統必須以 session snapshot 隔離當日調整與 template 原始內容。

## In Scope

1. 由 template 啟動 session
2. Session 內替換/刪除/新增動作
3. Session 與 template 隔離

## Out Scope

1. 調整自動回寫 template
2. 跨 session 批次套用調整

## Acceptance Criteria

- [ ] Given 使用者由 template 開始訓練，When 替換某動作，Then template 本身不改變。
- [ ] When 新增 manual item，Then 僅存在當次 session。
