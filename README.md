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
