// 商品管理 API

import { Router } from "express";
import pool from "../utils/connect-mysql.js";

const router = Router();

const getProductListData = async () => {
  const sql = "SELECT * FROM products ORDER BY id ASC;";
  const [rows] = await pool.query(sql);
  return {
    success: true,
    rows,
  };
};

const getItemListData = async () => {
  const sql = "SELECT * FROM product_items ORDER BY id ASC;";
  const [rows] = await pool.query(sql);
  return {
    success: true,
    rows,
  };
};

router.get("/", (req, res) => {
  res.json({ route: "products", success: true });
});

router.get("/products", async (req, res) => {
  const data = await getProductListData();
  res.json(data);
});

router.get("/items", async (req, res) => {
  const data = await getItemListData();
  res.json(data);
});

export default router;
