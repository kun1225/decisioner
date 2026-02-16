# 揪Gym (JoyGym) - Architecture Index

> **Version:** 2.4.0
> **Status:** Proposed
> **Last Updated:** 2026-02-16

## Overview

揪Gym (JoyGym) 採用 monorepo 架構：

1. `apps/web`：TanStack Start 前端
2. `apps/api`：Express API
3. `packages/database`：Drizzle + PostgreSQL
4. `packages/shared`：跨端 schema/type
5. `packages/auth`：密碼與 JWT

## Specs Entry

1. [docs/specs/index.md](specs/index.md)

## PRD Entry

1. [docs/PRD.md](PRD.md)
2. [docs/prd/index.md](prd/index.md)

## Notes

1. Specs 採核心 6 份文件：tech stack / monorepo / backend / frontend / api / data。
2. Acceptance Criteria 統一維護於 `docs/prd/goals/g-xx.md`。
