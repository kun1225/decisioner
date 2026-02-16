# G-02 Template Versioning

## Goal Statement

使用者與 crew 成員可安全編輯訓練 template，且保留完整歷史。

## Requirement

系統必須提供 template CRUD 與 append-only 版本快照。

## In Scope

1. Template CRUD
2. Crew 共編 template
3. 每次編輯建立新版本

## Out Scope

1. Template merge UI
2. 跨版本自動衝突解決

## Acceptance Criteria

- [ ] Given 同一份 template 被更新，When 儲存成功，Then 產生新 version，不覆蓋舊版。
- [ ] Given crew 成員有權限，When 編輯 template，Then 變更可被其他成員讀取。
