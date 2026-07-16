// 商品管理 API

import { Router } from "express";
import pool from "../utils/connect-mysql.js";

const router = Router();

// 排序選項 對照 sql
const sortList = {
  default: "total_sold ASC",
  latest: "p.created_at ASC",
  price_asc: "p.price ASC",
  price_desc: "p.price DESC",
};

// 寵物類別列表
const getPetTypeData = async () => {
  const sql = "SELECT * FROM product_pet_tags;";
  const rows = await pool.query(sql);
  return rows[0];
};
const petTypeList = await getPetTypeData();

// 商品類別列表
const getCategoryData = async () => {
  const sql = "SELECT * FROM product_category_tags;";
  const rows = await pool.query(sql);
  return rows[0];
};
const categoryList = await getCategoryData();

// 依商品(篩選後)讀取底下的所有品項
const attachItemsToProducts = async (products) => {
  const productIds = products.map((p) => p.id);
  const sql = `SELECT * FROM items WHERE prod_id_fk IN (?) ORDER BY prod_id_fk, id;`;
  const [itemRows] = await pool.query(sql, [productIds]);

  const itemMap = {};
  for (const item of itemRows) {
    if (!itemMap[item.prod_id_fk]) itemMap[item.prod_id_fk] = [];
    itemMap[item.prod_id_fk].push(item);
  }

  return products.map((product) => ({
    ...product,
    items: itemMap[product.id] || [],
  }));
};

// 讀取商品列表
const getProductListData = async (req) => {
  const petType = req.params.petType;
  const category = req.query.category || "";
  let tags = req.query.tags || "";
  let keywords = req.query.keywords || "";
  let priceMin = +req.query["min-value"] || -1;
  let priceMax = +req.query["max-value"] || -1;
  let sort = req.query.sort || "default";
  let page = +req.query.page || 1;
  const perPage = 16;

  // 篩選條件
  const petId = petTypeList.find((elem) => elem["tag_slug"] === petType).id;
  const categoryId = category.length
    ? categoryList.find((elem) => elem["tag_slug"] === category).id
    : 0;
  const filters = [`WHERE p.pet_tag_id_fk=${petId}`];
  if (categoryId) {
    filters.push(`category_id_fk=${categoryId}`);
  }
  if (priceMin > 0) {
    filters.push(`price>=${priceMin}`);
  }
  if (priceMax > 0) {
    filters.push(`price<=${priceMax}`);
  }
  const sql_filter = filters.join(" AND ");

  // 讀取商品數量(pagination用)
  const t_sql = `SELECT COUNT(*) totalRows FROM products p ${sql_filter} ;`;
  const [[{ totalRows }]] = await pool.query(t_sql);

  let totalPages = 0;
  let rows = [];
  if (totalRows > 0) {
    totalPages = Math.ceil(totalRows / perPage);
    const sql_sort = `ORDER BY ${sortList[sort]} , p.id ASC`;
    const sql = `
      SELECT
        p.*,
        COALESCE(item_stats.total_sold, 0) AS total_sold,
        COALESCE(item_stats.total_stock, 0) AS total_stock
      FROM products p
      LEFT JOIN (
        SELECT
          prod_id_fk,
          SUM(sold) AS total_sold,
          SUM(stock) AS total_stock
        FROM items
        GROUP BY prod_id_fk
      ) item_stats ON item_stats.prod_id_fk = p.id
      ${sql_filter}
      ${sql_sort}
      LIMIT ?,?;
      `;
    [rows] = await pool.query(sql, [(page - 1) * perPage, perPage]);

    if (rows.length) rows = await attachItemsToProducts(rows);
  }

  return {
    success: true,
    category,
    tags,
    keywords,
    priceMin,
    priceMax,
    sort,
    page,
    perPage,
    totalRows,
    totalPages,
    products: rows,
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
