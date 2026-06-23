// 訂單管理 API

import { Router } from "express";

const router = Router();

router.get("/", (req, res) => {
  res.json({ route: "orders", success: true });
});

export default router;
