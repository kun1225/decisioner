# PRD Planning

## Success Metrics (90 Days)

1. WAU（至少一次登入、建立 template 或完成訓練）
2. 每人每週完成 session 次數
3. Template 建立率與模板編輯完成率
4. 訓練開始到完成轉換率
5. 圖表頁使用率
6. 30 日留存率
7. Pro 轉換率（進階分析 + 個人化功能）

## Milestones

### MVP 1（先完成單人核心訓練流程）

1. 登入系統與登入 UI
2. 後台模板管理：選取模板、建立模板、修改模板、刪除模板
3. 後台模板動作管理：在模板內新增、刪除、修改動作
4. 開始訓練頁：選取模板、列出動作、輸入重量與次數，預設 3 組，可用 `+` 新增第 4 組以上
5. 訓練完成流程：頁面底部固定完成按鈕，完成後顯示彩帶回饋
6. Progress chart：至少交付 max weight / volume 圖表與基本 UI

### MVP 2（社交與留存體驗）

1. 打卡、streak 與 dashboard
2. 好友動態與 like 互動
3. 隱私控制與社交限制
4. 分享卡片
5. 好友排行（opt-in）

### MVP 3（進階分析與付費深化）

1. Pro analytics
2. Gym load conversion
3. 週挑戰與成就系統
4. 個人頁客製化（Pro）

## Risks & Mitigations

1. 模板編輯與訓練流程範圍過大
   對策：MVP 1 僅交付單人核心流程，社交與分享延後到 MVP 2

2. 歷史訓練編輯造成統計錯誤
   對策：revision + deterministic recompute

3. 訓練輸入流程過長導致中途放棄
   對策：預設 3 組、保留快速加組與固定底部完成按鈕

4. 隱私洩漏
   對策：統一 privacy guard + integration tests

5. 社交功能造成噪音或壓力
   對策：動態節流、排行榜 opt-in、可細化隱私控制
