# 10. UX Flows

## Scenario A: 建立 Template（含自訂動作）

1. 使用者進入 `/templates` -> 點擊建立 template
2. 輸入 template 名稱（例如 Chest A）
3. 新增動作：
   - 可選預設動作
   - 或建立自訂動作（名稱 + 圖片）
4. 上傳圖片流程：拿 pre-signed URL -> 直傳 S3 -> 完成綁定
5. 儲存 template，系統建立 version 1

## Scenario B: 由 Template 開始訓練，現場替換動作

1. 使用者進入 `/train/start`，選 gym + template
2. 系統建立 `workout_session` + `workout_session_items` 快照
3. 因器材占用，使用者替換某動作
4. 使用者記錄每組重量/次數
5. template 本身不被改動

## Scenario C: 訓練中查看上次/最佳

1. 使用者在 `/train/$sessionId` 點某動作
2. UI 顯示上次紀錄（日期、重量、次數、組數）
3. UI 顯示最佳紀錄（最大重量 + 該次數/組數）
4. 使用者依據資訊完成本次訓練

## Scenario D: 檢視過往訓練並編輯

1. 使用者進入 `/workouts/history`
2. 列表顯示每筆：訓練日期、template
3. 點擊某筆後進入 `/train/$sessionId`
4. 若為 `COMPLETED`，以「歷史編輯模式」開啟
5. 使用者可調整 sets/items 並儲存
6. 系統建立 revision 並更新統計圖表

## Scenario E: 與朋友共享 Template 協作

1. 使用者建立 crew 並邀請朋友
2. 免費版限制：每位使用者最多建立 1 個 crew、每個 crew 最多 2 位成員
3. 將 template 分享到 crew
4. 成員可編輯 template
5. 系統保留每次編輯版本與編輯者

## Scenario F: 查看朋友訓練與隱私控制

1. A 使用者預設好友可見
2. B 查看 A 最近訓練
3. 若 A 關閉「訓練紀錄可見」，B 仍可能只看得到日期
4. 若 A 關閉「日期可見」，B 完全看不到最近訓練日期

## Scenario G: Progress 分析（MVP 免費）

1. 使用者進入 `/progress`
2. 選擇某動作，查看 Max Weight / Volume 趨勢
3. 使用者依結果調整下週訓練安排

## Scenario H: Pro 進階分析（付費）

1. 使用者升級後可使用 e1RM / 肌群週訓練量 / adherence
2. 使用者可在 set 記錄 `RPE`、`RIR`
3. 使用者可設定每週訓練目標次數（adherence）
4. 使用者在新 gym 訓練某動作時，系統提供簡單建議重量（suggested load）
5. 使用者可開啟「記住此 gym 差異」以更新後續自動換算
6. Pro 不提供複雜換算公式編輯
