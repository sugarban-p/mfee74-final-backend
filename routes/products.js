// 商品管理 API

import { Router } from "express";
import pool from "../utils/connect-mysql.js";

const router = Router();

const getPetTypeData = async () => {
  const sql = "SELECT * FROM product_pet_tags;";
  const [rows] = await pool.query(sql);
  return rows;
};

const getProductListData = async (req) => {
  let category = req.query.category;
  let tags = req.query.tags;
  let sort = req.query.sort;
  let page = +req.query.page;
  const perPage = 16;

  if (category === undefined) {
    category = "all";
  }
  if (tags === undefined) {
    tags = [];
  }
  if (sort === undefined) {
    sort = "sold";
  }
  if (isNaN(page)) {
    page = 1;
  }

  const t_sql = "SELECT COUNT(*) totalRows FROM products;";
  const [[{ totalRows }]] = await pool.query(t_sql);
  let totalPages = 0;
  let rows = [];
  if (totalRows > 0) {
    totalPages = Math.ceil(totalRows / perPage);

    const sql = ` SELECT * FROM products ORDER BY id ASC LIMIT ?,?;`;
    [rows] = await pool.query(sql, [(page - 1) * perPage, perPage]);

    const productIds = rows.map((p) => p.id);
    let itemRows = [];

    const itemSql = `SELECT * FROM items WHERE prod_id_fk IN (?) ORDER BY prod_id_fk, id;`;

    [itemRows] = await pool.query(itemSql, [productIds]);
    const itemMap = {};

    for (const item of itemRows) {
      if (!itemMap[item.prod_id_fk]) {
        itemMap[item.prod_id_fk] = [];
      }

      itemMap[item.prod_id_fk].push(item);
    }
    rows = rows.map((product) => ({
      ...product,
      items: itemMap[product.id] || [],
    }));
  }

  return {
    success: true,
    category,
    tags,
    sort,
    page,
    perPage,
    totalRows,
    totalPages,
    rows: rows,
  };
};

router.get("/", (req, res) => {
  return res.redirect("./cat");
});

router.get("/:petType", async (req, res) => {
  const data = await getProductListData(req);
  res.json(data);
});

export default router;
