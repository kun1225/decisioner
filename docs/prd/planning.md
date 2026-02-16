# PRD Planning

## Success Metrics (90 Days)

1. WAU（至少一次打卡或訓練紀錄）
2. 每人每週完成 session 次數
3. 打卡連續 7 天達成率
4. 朋友互動率（愛心/每位活躍用戶）
5. 分享卡片使用率
6. 30 日留存率
7. Pro 轉換率（進階分析 + 進階分享 + 客製化）

## Milestones

### MVP 1（在現有基礎上新增社交打卡層）

1. 保留並交付既有核心：template + workout + history edit + gym-aware + max/volume 圖表
2. 新增打卡、連續天數、首頁儀表板
3. 新增好友動態、愛心互動、簡單個人頁
4. 新增隱私設定強化、基礎提醒
5. 新增分享卡片（免費基礎模板 + Pro 進階模板）

### MVP 2（留存與社交競合）

1. 週挑戰
2. 成就系統展示與任務化
3. 好友排行（opt-in）

### MVP 3（付費深化）

1. 個人頁客製化（Pro）
2. 與既有 Pro analytics 整合成完整付費體驗

## Risks & Mitigations

1. 多人編輯衝突
   對策：版本號 + optimistic concurrency

2. 歷史訓練編輯造成統計錯誤
   對策：revision + deterministic recompute

3. 隱私洩漏
   對策：統一 privacy guard + integration tests

4. 社交功能造成噪音或壓力
   對策：動態節流、排行榜 opt-in、可細化隱私控制
