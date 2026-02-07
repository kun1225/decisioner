# Decision Log - Architecture Document

> **Version:** 2.0.0
> **Status:** Approved
> **Last Updated:** 2026-02-06

---

## Overview

Decision Log 使用 monorepo 架構，採用 pnpm workspaces + Turborepo 管理多個 packages。

### Tech Stack

| Layer           | Technology         | Version |
| --------------- | ------------------ | ------- |
| Frontend        | TanStack Start     | ^1.x    |
| Backend API     | Express.js         | ^5.x    |
| Database        | PostgreSQL         | 17      |
| ORM             | Drizzle ORM        | ^0.45   |
| Authentication  | DIY (bcrypt + JWT) | -       |
| Validation      | Zod                | ^3.x    |
| Package Manager | pnpm               | ^9.x    |
| Build System    | Turborepo          | ^2.x    |

---

## Specs

每一份 spec 包含該主題的完整細節與範例程式碼。

| #   | Spec                                                      | Description                                                  |
| --- | --------------------------------------------------------- | ------------------------------------------------------------ |
| 1   | [Tech Decisions](specs/1-tech-decisions.md)               | ORM（Drizzle vs Prisma）、Auth（DIY vs Lucia/Clerk）選型理由 |
| 2   | [Monorepo Structure](specs/2-monorepo-structure.md)       | 目錄結構、packages 職責與依賴關係                            |
| 3   | [Data Model](specs/3-data-model.md)                       | ERD、欄位定義、indexes、enums、設計決策                      |
| 4   | [API Design](specs/4-api-design.md)                       | REST endpoints、error codes、request/response 格式           |
| 5   | [State Machine](specs/5-state-machine.md)                 | Decision 狀態流轉（DRAFT→ACTIVE→CLOSED）與權限矩陣           |
| 6   | [Core Mechanisms](specs/6-core-mechanisms.md)             | Freeze、Confidence History、State Validation、Multi-tenancy  |
| 7   | [Authentication](specs/7-authentication.md)               | JWT flow、bcrypt 密碼處理、auth middleware                   |
| 8   | [Frontend Architecture](specs/8-frontend-architecture.md) | Route 結構、State Management、Server Functions 策略          |
| 9   | [Build & Development](specs/9-build-and-development.md)   | Turborepo pipeline、env vars、Docker Compose、scripts        |
| 10  | [UX Flows](specs/10-ux-flows.md)                          | 完整使用者情境與流程圖（7 個 Scenario）                      |
| 11  | [Example Decision](specs/11-example-decision.md)          | 一個完整決策範例 walkthrough                                 |

---

## Revision History

| Version | Date       | Author | Changes                                           |
| ------- | ---------- | ------ | ------------------------------------------------- |
| 2.0.0   | 2026-02-06 | -      | Restructure: index + numbered specs               |
| 1.1.0   | 2026-02-06 | -      | Auth: Lucia → DIY (bcrypt + JWT), remove sessions |
| 1.0.0   | 2026-02-05 | -      | Initial architecture document                     |
