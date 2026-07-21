## MFEE74 期末專題 - 後端

此專案為 Node.js + Express + MySQL 後端，已補上可對接前端 `mfee74-final-frontend` 的認證、會員中心與客服 API。

### 專案結構
```bash
/
├─ _docs/              # Agent 協作規範文件
├─ routes/             # API 路由模組
├─ SQL/                # 資料庫腳本
├─ utils/              # 共用工具
├─ .env.example        # 環境變數範例
├─ .gitignore          # Git 忽略規則
├─ agents.md           # Agent 協作準則
├─ index.js            # Express 主程式
├─ package.json        # 專案套件設定
├─ pnpm-lock.yaml      # pnpm 鎖定檔
├─ pnpm-workspace.yaml # pnpm 工作區設定
└─ README.md           # 專案說明
```

### 快速啟動
1. 安裝套件
```bash
pnpm install
```

2. 建立環境變數
```bash
cp .env.example .env
```

3. 建立核心資料表（MySQL）
```bash
mysql -u root -p mofu_data < SQL/mofu_core_tables.sql
```

4. 啟動後端
```bash
pnpm run dev
```

### 已實作 API（對接前端）
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/refresh`
- `POST /api/auth/forgot-password`
- `GET /api/oauth/google`（開發環境 mock fallback）
- `POST /api/otp/send`
- `POST /api/otp/verify`
- `GET /api/user/profile`
- `PATCH /api/user/update`
- `GET /api/user/security`
- `POST /api/user/change-password`
- `GET /api/dashboard/stats`
- `GET /api/chat/history`
- `POST /api/chat/send`
- `POST /api/chat/case/close`

### 說明
- `member/coupons`、`member/favorites`、`member/orders`、`member/pets` 相關獨立頁面功能未在此後端額外擴充。
- `dashboard/stats` 會讀取 `orders/favorites/pets/user_coupons`，若資料表尚未建立會自動回傳 0，避免中斷頁面。

### AI 客服回覆設定
- `POST /api/chat/send` 已支援 LLM 串接，並保留既有 FAQ 與敏感詞防護。
- 回覆流程：敏感詞攔截 -> FAQ 命中 -> 呼叫 AI -> AI 失敗時 fallback 固定訊息。

請於 `.env` 設定以下參數：

```bash
AI_ENABLED=true
AI_PROVIDER=gemini
AI_TIMEOUT_MS=10000
AI_MAX_TOKENS=300
AI_TEMPERATURE=0.4
AI_MODEL=gemini-2.5-flash

GEMINI_API_KEY=your_gemini_api_key
GEMINI_BASE_URL=https://generativelanguage.googleapis.com/v1beta
```

補充：
- 若 `AI_ENABLED=false` 或 Gemini 必填參數未設定，系統會自動使用 fallback 回覆，不會中斷 API。
- AI 相關資訊會寫入 `chat_messages.metadata`（模型、耗時、token usage、finish reason）供後續追蹤。
