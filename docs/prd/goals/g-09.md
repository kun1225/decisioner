# G-09 Reminder

## Goal Statement

使用者可設定固定提醒時段，維持打卡與訓練習慣。

## Requirement

系統必須提供提醒設定（頻率、時間、時區、啟用狀態）。

## In Scope

1. Daily / Weekly 提醒
2. 啟用/停用
3. 時區設定

## Out Scope

1. 智慧提醒最佳化
2. 推播內容 A/B 測試

## Acceptance Criteria

- [ ] Given 使用者更新提醒設定，When 儲存成功，Then 下次讀取應回傳同設定。
- [ ] When 提醒被停用，Then 不應再排入發送。
