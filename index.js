/* ===== 匯入框架/模組/參數 ===== */
import "dotenv/config"; // 讀取 .env 檔案到 process.env
import dotenv from "dotenv";
dotenv.config();
import express from "express"; // Express 框架
import session from "express-session"; // session 中間件
import cookieParser from "cookie-parser"; // 解析 Cookie 的中間件
import MySQLStore from "express-mysql-session"; // 把 session 存到 SQL
import moment from "moment-timezone"; // 時間處理工具
import pool, { closeMysqlPool } from "./utils/connect-mysql.js"; // 測試+監控SQL連線池

import authRoutes from "./routes/auth.js";
import productRoutes from "./routes/products.js";
import petsRoutes from "./routes/pets.js";
import orderRoutes from "./routes/orders.js";
import couponRoutes from "./routes/coupons.js";

/* ===== 建立 server 個體 ===== */
const app = express();

/**
 * ===== 前後端跨來源請求（CORS） =====
 *
 * 前端開發網址是 http://localhost:3000，
 * 後端 API 網址是 http://localhost:3001。
 * 即使 hostname 相同，只要 port 不同，瀏覽器就會視為不同來源。
 *
 * 目前會員登入尚未整併，寵物 API 暫時使用 PET_DEMO_USER_ID；
 * 先保留 Allow-Credentials，之後整併登入 Session 時才能攜帶 Cookie。
 */
app.use((req, res, next) => {
  // credentials 模式不能使用 "*"，必須指定允許的前端來源。
  res.header("Access-Control-Allow-Origin", "http://localhost:3000");
  res.header("Access-Control-Allow-Credentials", "true");

  // 允許前端以 JSON 格式傳送資料。
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept",
  );

  // 允許目前 API 會使用的 HTTP 方法。
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  );

  // 瀏覽器在部分跨來源請求前會先送 OPTIONS 預檢請求。
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

/* ===== 設置全域 middleware ===== */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * 讓前端可以透過 /uploads/pets/檔名 顯示後端保存的寵物照片。
 */
app.use("/uploads", express.static("public/uploads"));
app.use(
  session({
    secret: "team3-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60, // 1 小時
    },
  }),
);
app.use((req, res, next) => {
  res.locals.pageName = "";
  res.locals.title = "Team3";
  res.locals.admin = req.session.admin || null;
  next(); // 往下走, 比對以下的路由
});

/* ===== 定義 API Router ===== */
app.get("/", (req, res) => {
  res.json({ success: true });
});

// 會員
app.use("/api/auth", authRoutes);
// 商品
app.use("/api/products", productRoutes);
// 寵物
app.use("/api/pets", petsRoutes);
// 訂單
app.use("/api/orders", orderRoutes);
// 優惠券
app.use("/api/coupons", couponRoutes);

/* ===== 伺服器啟動+監聽 ===== */
const port = process.env.PORT || 3001;
const server = app.listen(port, () => {
  console.log(`Server is running on: ${port}`);
  console.log(`http://localhost:${port}/`);
});
// Ctrl+C 關閉伺服器
process.on("SIGINT", (signal) => {
  console.log("\n伺服器關閉中...");

  server.close(async () => {
    await closeMysqlPool();
    console.log("【伺服器已安全關閉】");
    process.exit(0);
  });
});
