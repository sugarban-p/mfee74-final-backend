# Improve Log

> 本檔案記錄每次安全性、效能、架構改善的修改摘要

---

## 2026-05-27 — Step 1: 安全性修復

### 修正目的
- 修補 SQL 注入漏洞（字串拼接 → 參數化查詢）
- 對所有 POST/PUT 端點加入必要欄位伺服器端驗證，防止不合法請求進入 DB 層

### 修改檔案

| 檔案 | 改動說明 |
|------|----------|
| `utils/prod-mysql.js` | `getApiItemData` 的 `req.query.skuBase` 改為 `?` 佔位符參數化查詢 |
| `routes/products.js` | `POST /lists/add` 加入 `product`/`petType`/`usage` 必填檢查 |
| `routes/products.js` | `PUT /lists/edit` 加入 `skuBase` 必填檢查 |
| `routes/products.js` | `POST /tags/usage/add` 加入 `usageName`/`usageCode` 格式驗證（2 個英文字母） |
| `routes/cms.js` | `POST /product-page/:skuBase/edit` 加入 body 非空驗證 |

### 影響範圍
- 所有改動均為自封閉，無需修改前端 EJS 或其他檔案
- 前端 AJAX handler 已實作 `result.success` 判斷，相容 `{success: false}` 錯誤回應
