# G-06 Checkin Dashboard

## Goal Statement

使用者可快速打卡並在首頁看到訓練與 streak 摘要。

## Requirement

系統必須提供每日打卡、streak 計算與 dashboard summary。

## In Scope

1. 每日打卡（可綁定 session）
2. 連續打卡天數計算
3. Dashboard 摘要（週訓練、streak、近期活動）

## Out Scope

1. 打卡社群挑戰
2. 自訂 dashboard 模組

## Acceptance Criteria

- [ ] Given 當天尚未打卡，When 使用者打卡，Then 建立 check-in 並回傳最新 streak。
- [ ] Given 已連續打卡 N 天，When 次日再次打卡，Then streak = N+1。
