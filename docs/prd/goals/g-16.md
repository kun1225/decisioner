# G-16 Friends Leaderboard

## Goal Statement

使用者可在好友範圍查看週排行，並可自行選擇是否參與。

## Requirement

系統必須提供好友週排行與 opt-in/opt-out 機制。

## In Scope

1. 週排行資料
2. 好友範圍排行
3. 參與開關（opt-in/out）

## Out Scope

1. 全站公開排行榜
2. 即時秒級排名更新

## Acceptance Criteria

- [ ] Given 使用者 opt-in，When 週排行產生，Then 可出現在好友排行中。
- [ ] Given 使用者 opt-out，When 週排行查詢，Then 不再顯示於新週排行。
