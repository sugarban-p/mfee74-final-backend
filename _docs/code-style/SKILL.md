# Code Style Skill

本 Skill 用於協助 Agent 在修改專案程式碼時遵守開發規範。

## 使用原則

執行任何程式碼修改前，先依任務類型讀取相關規範：

- 一般程式修改：讀取 `rules/agent-workflow.md`
- 新增或移動文件：讀取 `rules/project-structure.md`
- 格式化、命名、import：讀取 `rules/formatting.md` 與 `rules/naming-and-imports.md`
- 新增或修改註解：讀取 `rules/comments.md`
- 非同步流程或共用邏輯：讀取 `rules/async-and-pure-functions.md`
- Prisma 查詢或 schema 相關任務：讀取 `rules/prisma.md`

## 優先順序

若本 Skill 與專案根目錄的 `AGENTS.md` 衝突，以專案 `AGENTS.md` 為準。
若本 Skill 與使用者明確指令衝突，以使用者當前指令為準。
