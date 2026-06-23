// 優惠券管理 API

import { Router } from "express";

const router = Router();

router.get("/", (req, res) => {
  res.json({ route: "coupons", success: true });
});

export default router;
