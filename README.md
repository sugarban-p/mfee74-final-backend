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

### 前端互動流程

**\- 商品列表**

前端進入商品列表頁時，會打：

```http
GET /api/products/:petType
```

例如：

```http
GET /api/products/cat
GET /api/products/dog?search=皇家&page=1
```

後端流程是：

1. 前端選寵物類型，例如貓/狗  
   URL path 的 `:petType` 會被 `getParams()` 解析，可以是 id 或 slug。  
   找不到 petType 會回：

   ```js
   {
     success: false;
   }
   ```

2. 前端點分類 category  
   例如：

   ```http
   /api/products/cat?category=main-food
   ```

   後端會把 category 轉成 `selectedCategoryId`，加入 SQL filter：

   ```sql
   p.category_id_fk = ?
   ```

3. 前端勾選 tags / keywords  
   例如：

   ```http
   /api/products/cat?tags=1,2&keywords=3,5
   ```

   後端會用 `parseIdList()` 轉成去重後的 id array。  
   tags 是「符合任一 tag」；keywords 目前是每個 keyword 都要符合，因為它是逐一加 `EXISTS`。

4. 前端輸入搜尋文字 search  
   例如：

   ```http
   /api/products/cat?search=皇家
   ```

   後端會透過 `buildSearchFilter()` 搜尋三個範圍：
   - `products.prod_name`
   - `items.item_name`
   - `keywords.keyword`

   這段 search 條件獨立在 `searchFilters`，未來要加搜尋欄位，只要擴充這個 array。

5. 前端調整價格  
   例如：

   ```http
   /api/products/cat?min-value=500&max-value=1500
   ```

   後端加入：

   ```sql
   p.price >= ?
   p.price <= ?
   ```

6. 前端選排序 sort  
   例如：

   ```http
   /api/products/cat?sort=price_asc
   ```

   會套用 `sortList`：
   - `default`: `total_sold DESC`
   - `latest`: `p.created_at ASC`
   - `price_asc`: `p.price ASC`
   - `price_desc`: `p.price DESC`

7. 前端切換頁碼 page  
   例如：

   ```http
   /api/products/cat?page=2
   ```

   後端先 `COUNT(*)` 算總筆數，再用：

   ```sql
   LIMIT 16 OFFSET ?
   ```

   只查目前頁面的商品。

**\- 後端查詢順序**

目前 `GET /api/products/:petType` 的主要流程是：

1. `getParams(req)`  
   把前端 query string 轉成乾淨的 params。

2. `countCategoryProduct(params.petTypeId)`  
   算分類資料，目前 categories 只依照 petType 統計。

3. `getProductListData(params)`  
   做商品查詢主流程：
   - `buildProductFilters()` 組合所有 filter
   - `COUNT(*)` 算 `totalRows`
   - 查 `keywords` facet
   - 查 `tags` facet
   - 查當頁 products
   - 用 product ids 補上：
     - items
     - intros
     - avatars
     - images

4. 回傳前端：

```js
{
  success,
  params,
  facets: {
    categories,
    keywords,
    tags
  },
  pagination: {
    currentPage,
    perPage,
    totalRows,
    totalPages
  },
  products
}
```

**\- 前端怎麼用**

每次使用者改變篩選條件時，前端只要重新組 URL 並打同一支 API：

```http
GET /api/products/cat?category=main-food&tags=1,2&keywords=3&search=皇家&min-value=300&max-value=2000&sort=price_asc&page=1
```

收到 response 後：

- `products` 渲染商品卡片
- `facets.categories` 渲染分類選單
- `facets.keywords` 渲染可用 keywords
- `facets.tags` 渲染可用 tags
- `pagination` 渲染分頁 UI

小提醒：目前 `keywords/tags` facet 會依所有條件包含 `search` 重算；`categories` 目前只依 petType 統計。

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
