# 揪Gym (JoyGym) - Architecture Index

> **Version:** 2.3.0
> **Status:** Proposed
> **Last Updated:** 2026-02-15

---

## Overview

揪Gym (JoyGym) 採用 monorepo 架構：

1. `apps/web`：TanStack Start 前端（React 19 + Vite + shadcn/Base UI + Tailwind CSS v4）
2. `apps/api`：Express API
3. `packages/database`：Drizzle + PostgreSQL
4. `packages/shared`：跨端 schema/type
5. `packages/auth`：密碼與 JWT

核心產品能力：

1. gym/equipment-aware 重訓記錄
2. template 建立、共享與版本歷史
3. 訓練中動態替換動作
4. 上次/最佳表現與基礎圖表（max-weight / volume）
5. 可回看並編輯過往訓練（日期 + template）
6. MVP 1 社交打卡層：打卡、儀表板、好友動態、愛心、提醒、分享卡
7. 朋友協作與隱私控制（MVP Free-Lite：每人最多 1 群、每群最多 2 人）
8. MVP 2：週挑戰、成就、好友排行
9. Pro 進階分析（e1RM / 肌群週訓練量 / adherence / RPE-RIR）
10. MVP 3（Pro）：個人頁客製化

---

## Specs Index

| #   | Spec                                                      | Focus                         |
| --- | --------------------------------------------------------- | ----------------------------- |
| 1   | [Tech Decisions](specs/1-tech-decisions.md)               | 技術選型與關鍵取捨            |
| 2   | [Monorepo Structure](specs/2-monorepo-structure.md)       | 目錄與模組責任                |
| 3   | [Data Model](specs/3-data-model.md)                       | DB schema、ERD、indexes       |
| 4   | [API Design](specs/4-api-design.md)                       | REST contract 與錯誤語意      |
| 5   | [State Machine](specs/5-state-machine.md)                 | Workout / social 狀態流轉     |
| 6   | [Core Mechanisms](specs/6-core-mechanisms.md)             | 版本化、隱私、圖表、成就、S3  |
| 7   | [Authentication](specs/7-authentication.md)               | JWT/refresh rotation 安全模型 |
| 8   | [Frontend Architecture](specs/8-frontend-architecture.md) | 路由、資料流、頁面責任        |
| 9   | [Build & Development](specs/9-build-and-development.md)   | 開發腳本、環境變數、部署基礎  |
| 10  | [UX Flows](specs/10-ux-flows.md)                          | 核心使用情境與互動流程        |
| 11  | [Example Workout](specs/11-example-decision.md)           | 實例 walkthrough              |

---

## Change Log

| Version | Date       | Changes                                                                                      |
| ------- | ---------- | -------------------------------------------------------------------------------------------- |
| 2.3.0   | 2026-02-15 | 新增 MVP 1/2/3 路線：打卡與好友動態、週挑戰/排行、Pro 個人頁客製化；保留既有 gym/charts 規格 |
| 2.2.1   | 2026-02-15 | 同步 web 技術堆疊文件（TanStack Start + shadcn/Base UI + Tailwind v4）                       |
| 2.2.0   | 2026-02-15 | 定義 MVP Free 與 Pro 邊界：進階分析改為 Pro；朋友健身改為 MVP Free-Lite（1 群/2 人上限）     |
| 2.1.0   | 2026-02-11 | 將細節下放 specs，ARCHITECTURE 改為精簡索引；新增「過往訓練可編輯」                          |
| 2.0.0   | 2026-02-11 | 首版 Fitness 架構草案                                                                        |
