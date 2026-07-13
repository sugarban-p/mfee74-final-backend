// Functionality: bootstrap the Express backend and mount feature APIs. Purpose: provide a single Node.js entrypoint for frontend integration.

import "dotenv/config";
import express from "express";
import session from "express-session";
import cookieParser from "cookie-parser";

import { closeMysqlPool } from "./utils/connect-mysql.js";

import authRoutes from "./routes/auth.js";
import otpRoutes from "./routes/otp.js";
import userRoutes from "./routes/user.js";
import dashboardRoutes from "./routes/dashboard.js";
import chatRoutes from "./routes/chat.js";
import oauthRoutes from "./routes/oauth.js";
import productRoutes from "./routes/products.js";
import petsRoutes from "./routes/pets.js";
import orderRoutes from "./routes/orders.js";
import couponRoutes from "./routes/coupons.js";

/* ===== 建立 server 個體 ===== */
const app = express();

/* ===== 設置全域 middleware ===== */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use((req, res, next) => {
  const allowOrigin = process.env.CORS_ORIGIN || "http://localhost:3000";
  res.header("Access-Control-Allow-Origin", allowOrigin);
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  );
  if (req.method === "OPTIONS") return res.sendStatus(204);
  return next();
});

app.use(
  session({
    secret: process.env.SESSION_SECRET || "team3-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60,
    },
  }),
);

app.use((req, res, next) => {
  res.locals.pageName = "";
  res.locals.title = "Team3";
  res.locals.admin = req.session.admin || null;
  next();
});

/* ===== 定義 API Router ===== */
app.get("/", (req, res) => {
  res.json({ success: true });
});

app.use("/api/auth", authRoutes);
app.use("/api/otp", otpRoutes);
app.use("/api/user", userRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/oauth", oauthRoutes);

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
process.on("SIGINT", () => {
  console.log("\n伺服器關閉中...");

  server.close(async () => {
    await closeMysqlPool();
    console.log("【伺服器已安全關閉】");
    process.exit(0);
  });
});
