// 商品管理 API

import { Router } from "express";
import pool from "../utils/connect-mysql.js";

const router = Router();

const sortList = {
  default: "sold ASC",
  latest: "created_at ASC",
  price_asc: "price ASC",
  price_desc: "price DESC",
};

const getPetTypeData = async () => {
  const sql = "SELECT * FROM product_pet_tags;";
  const rows = await pool.query(sql);
  return rows[0];
};
const petTypeList = await getPetTypeData();

const getCategoryData = async () => {
  const sql = "SELECT * FROM product_category_tags;";
  const rows = await pool.query(sql);
  return rows[0];
};
const categoryList = await getCategoryData();

const getProductListData = async (req) => {
  const petType = req.params.petType;
  const category = req.query.category || "";
  console.log("cat=", category);
  let tags = req.query.tags || [];
  let keywords = req.query.keywords || "";
  let priceMin = +req.query["min-value"] || -1;
  let priceMax = +req.query["max-value"] || -1;
  let sort = req.query.sort || "default";
  let page = +req.query.page || 1;
  const perPage = 16;

  const petId = petTypeList.find((elem) => elem["tag_slug"] === petType).id;
  const categoryId = category.length
    ? categoryList.find((elem) => elem["tag_slug"] === category).id
    : 0;

  const filters = [`WHERE pet_tag_id_fk=${petId}`];
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
  const t_sql = `SELECT COUNT(*) totalRows FROM products ${sql_filter} ;`;
  const [[{ totalRows }]] = await pool.query(t_sql);
  let totalPages = 0;
  let rows = [];
  if (totalRows > 0) {
    totalPages = Math.ceil(totalRows / perPage);

    const sql = `SELECT * FROM products ${sql_filter} ORDER BY id LIMIT ?,?;`;
    [rows] = await pool.query(sql, [(page - 1) * perPage, perPage]);

    const productIds = rows.map((p) => p.id);
    let itemRows = [];

    const item_sql = `SELECT * FROM items WHERE prod_id_fk IN (?) ORDER BY prod_id_fk, id;`;

    [itemRows] = await pool.query(item_sql, [productIds]);
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
