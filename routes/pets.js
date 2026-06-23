// 寵物管理 API

import { Router } from "express";

const router = Router();

router.get("/", (req, res) => {
  res.json({ route: "pets", success: true });
});

export default router;
