# Product Requirements Document: Decisioner Fitness

> **Version:** 2.3.0
> **Status:** Draft
> **Last Updated:** 2026-02-15
> **Author:** Kun

---

## Executive Summary

Decisioner Fitness 是一個專注於重量訓練記錄的 app，核心價值是：

1. 針對不同健身房與器材差異，提供可比較紀錄
2. 用 template 加速訓練，同時保留當日調整彈性
3. 支援朋友協作與可控隱私
4. 透過圖表與成就系統回饋長期進步

---

## Why Now

1. 既有重訓 app 對跨 gym 差異支援不足
2. 使用者已明確有共享課表與社交訓練需求
3. 現有專案基礎可快速落地 MVP

---

## Problem Statement

1. 同動作在不同 gym 的器材差異下，重量不可直接比較
2. 現場器材占用常需臨時換動作
3. 長期缺乏可追蹤進步與社交激勵

---

## Goals & Non-Goals

### Goals

| Priority | Goal                                                                            |
| -------- | ------------------------------------------------------------------------------- |
| P0       | 支援跨健身房的訓練紀錄與比較                                                    |
| P0       | 提供 template + 當日可替換/新增動作                                             |
| P0       | 訓練中顯示同動作上次與最佳紀錄                                                  |
| P0       | 可查看過往訓練紀錄（日期、template）並進入訓練頁編輯                            |
| P0       | 朋友健身（免費版 Lite）：支援好友互動與群組，但限制每群最多 2 人、每人最多 1 群 |
| P1       | 朋友訓練可見性可設定（預設好友可見）                                            |
| P1       | 教練導向進步圖表（e1RM、肌群週訓練量、adherence、RPE/RIR）作為付費進階功能      |
| P1       | 成就系統提升持續訓練動機                                                        |

### Non-Goals (MVP)

1. 飲食與營養追蹤
2. 體脂硬體同步
3. AI 自動排課
4. 即時姿勢辨識

---

## Target Users

1. 多場館訓練者
2. 課表化訓練者
3. 社交訓練者

---

## Product Scope

### 1. Gym-aware 記錄

1. 建立多個 gym
2. 每次訓練綁定 gym
3. 同動作可依 gym 分開比較

### 2. Template 系統

1. 建立 template（胸/背/腿）
2. 可加預設或自建動作
3. 自建動作可上傳圖片（S3）
4. 群組共享 template 支援多人編輯
5. 所有編輯保留版本歷史

### 3. 訓練 Session（當日可調整）

1. 由 template 啟動訓練
2. 現場可替換、刪除、新增動作
3. 當日修改只影響 session，不直接覆蓋 template

### 4. 即時歷史參考

1. 顯示同動作上次紀錄
2. 顯示同動作最佳紀錄（以最大重量為主，含該次數/組數）

### 5. 訓練歷史與可編輯

1. 使用者可查看自己的歷史訓練列表
2. 列表顯示日期與 template
3. 可點進訓練頁編輯過往紀錄
4. 編輯後需保留 revision 並重算統計

### 6. 朋友與隱私

1. 可加好友、建立 crew
2. 可查看朋友最近訓練日期與紀錄（受隱私控制）
3. 預設可見性為好友可見
4. MVP 免費版限制：每位使用者最多建立 1 個 crew
5. MVP 免費版限制：每個 crew 最多 2 位成員（owner + 1）

### 7. 進步圖表

1. 最大重量趨勢圖
   x 軸：時間
   y 軸：最大重量
   附加資訊：該最大重量出現時的次數與第幾組

2. 訓練量趨勢圖
   x 軸：時間
   y 軸：重量乘次數（volume）

### 8. 付費進階分析（Pro）

1. e1RM 趨勢圖（Epley）
   x 軸：時間
   y 軸：estimated 1RM

2. 肌群週訓練量趨勢圖
   x 軸：週
   y 軸：該肌群總 volume（預設 primary muscle）

3. 每週訓練 adherence 圖
   x 軸：週
   y 軸：完成率（completed sessions / weekly target）

4. 每組可選填 RPE 與 RIR（記錄與分析皆為 Pro）
5. 簡單自動換算：
   - 第一次在新 gym 練某動作時，顯示其他 gym 的歷史紀錄作為參考
   - 使用者可啟用「記住此 gym 差異」，之後自動給出建議重量
   - 不提供器材層級管理，不提供複雜換算規則編輯

### 9. 成就系統

1. 第 X 次重訓
2. 突破個人最大重量 X 次
3. 與朋友一起重訓 X 次

---

## Functional Requirements

### FR-01 動作與媒體

1. 系統提供預設動作庫
2. 使用者可建立自訂動作
3. 圖片上傳使用 S3 pre-signed URL

### FR-02 Template 與版本歷史

1. template 支援 CRUD
2. crew 成員可共同編輯
3. 每次編輯建立不可變版本快照

### FR-03 Session 流程

1. 開始訓練時建立 session 快照
2. 可在 session 內替換/新增動作
3. set 至少包含重量、次數、組序、時間

### FR-04 上次/最佳查詢

1. 上次：同動作最近一次完成 session
2. 最佳：同動作最大重量最高的一組
3. 同重量 tie-break：次數高者優先，再取較新時間

### FR-05 歷史訓練可編輯

1. 提供歷史列表 API（日期、template）
2. completed session 可進入訓練頁編輯
3. 編輯後保留 revision
4. 編輯後重算 metrics 與成就

### FR-06 社交與隱私

1. 好友狀態至少含 pending/accepted/blocked
2. 日期與詳細紀錄分開控制可見性
3. 免費版限制：每位使用者最多建立 1 個 crew
4. 免費版限制：每個 crew 最多 2 位成員（owner + 1）

### FR-07 Progress Insights

1. MVP 免費版提供 max weight / volume 兩種單動作趨勢
2. `last/best` 維持 MVP 免費能力

### FR-08 Pro Analytics（付費）

1. 提供 e1RM 趨勢圖（Epley）
2. 提供按肌群的 weekly volume 趨勢
3. 提供 weekly adherence（completed / target）
4. 提供 RPE/RIR 記錄與分析
5. 提供 gym-level 簡單自動換算（不含器材層級設定）

### FR-09 成就引擎

1. 規則可配置
2. 完成訓練或突破紀錄時觸發
3. 發放需去重

---

## Success Metrics (90 Days)

1. WAU
2. 每人每週完成 session 次數
3. template 啟動訓練佔比
4. 朋友互動率
5. 30 日留存率
6. Pro 轉換率（升級進階分析）

---

## Milestones

### Phase 1 (Core)

1. template + workout + history list + past edit
2. last/best + 基礎 progress（max weight / volume）
3. social lite（friends + crews）：每人最多 1 群、每群最多 2 人

### Phase 2 (Social)

1. privacy controls 完整化
2. social 配額/權限策略擴充（超出 Lite 限制）

### Phase 3 (Insights)

1. Pro analytics（e1RM / weekly muscle volume / adherence / RPE-RIR）
2. charts + achievements
3. 查詢與快取優化

---

## Risks & Mitigations

1. 多人編輯衝突
   對策：版本號 + optimistic concurrency

2. 歷史訓練編輯造成統計錯誤
   對策：revision + deterministic recompute

3. 隱私洩漏
   對策：統一 privacy guard + integration tests

---

## Confirmed Decisions

1. 最大重量圖：以最大重量為主，並顯示該次數/組數
2. 預設可見性：好友可見
3. 圖片儲存：S3
4. 群組 template：允許成員編輯，保留歷史紀錄
5. 使用者可查看並編輯過往訓練（經歷史列表進入）
6. 進階分析（e1RM / weekly muscle volume / adherence / RPE-RIR）不納入 MVP，定位為 Pro
7. e1RM 公式固定採 `Epley`
8. 肌群維度採中粒度 10 群（chest/back/shoulders/biceps/triceps/quads/hamstrings/glutes/calves/core），僅 Pro 啟用
9. 朋友健身納入 MVP 免費版，但限制每位使用者最多建立 1 群、每群最多 2 人
10. Pro 只提供簡單自動換算，不做更細的換算規則與分析
