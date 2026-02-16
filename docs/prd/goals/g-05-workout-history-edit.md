# G-05 Workout History Edit

## Goal Statement

使用者可回看並編輯過往訓練，且系統可追溯變更。

## Requirement

系統必須支援 completed session 的歷史編輯與 revision 重算。

## In Scope

1. 歷史列表（日期、template）
2. Completed session 可編輯
3. 寫入 revision 並重算 metrics

## Out Scope

1. 還原到任意 revision 的 UI
2. 多人同時編輯同 session

## Acceptance Criteria

- [ ] Given completed session，When 使用者儲存編輯，Then 建立新 revision。
- [ ] When revision 建立後，Then 相關統計資料會重算。
