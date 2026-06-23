// 商品管理 API

import { Router } from "express";

const router = Router();

router.get("/", (req, res) => {
  res.json({ route: "products", success: true });
});

export default router;
