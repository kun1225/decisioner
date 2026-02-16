# G-01 Gym-aware Record

## Goal Statement

使用者可以在不同健身房追蹤同一動作的訓練紀錄，且資料可比較。

## Requirement

系統必須支援多 gym 管理，並在每次訓練中綁定 gym 資訊。

## In Scope

1. 建立/管理多個 gym
2. 每次訓練 session 綁定 gym
3. 同動作可按 gym 區分歷史紀錄

## Out Scope

1. 器材層級（machine-level）模型
2. 複雜換算規則編輯

## Acceptance Criteria

- [ ] Given 使用者有兩個 gym 的同動作紀錄，When 查詢該動作歷史，Then 可按 gym 區分顯示。
- [ ] When 使用者開始訓練，Then session 必須保存 `gym_id`。
