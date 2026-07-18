// 商品管理 API

import { Router } from "express";
import pool from "../utils/connect-mysql.js";

const router = Router();

// sql - 排序選項 對照
const sortList = {
  default: "total_sold ASC",
  latest: "p.created_at ASC",
  price_asc: "p.price ASC",
  price_desc: "p.price DESC",
};

// sql - 寵物類別列表
const getPetTypeData = async () => {
  const sql = "SELECT * FROM product_pet_tags;";
  const rows = await pool.query(sql);
  return rows[0];
};
const petTypeList = await getPetTypeData();

// sql - 商品類別列表
const getCategoryData = async () => {
  const sql = "SELECT * FROM product_category_tags;";
  const rows = await pool.query(sql);
  return rows[0];
};
const categoryList = await getCategoryData();

// sql - 貓/狗 各類別商品數量
const countCategoryProduct = async (pet_tag_id) => {
  const sql = `SELECT pct.*, COUNT(p.category_id_fk) AS catCount FROM ( SELECT * FROM products WHERE pet_tag_id_fk = ? ) p LEFT JOIN product_category_tags pct ON p.category_id_fk=pct.id GROUP BY pct.tag_ch ORDER BY pct.id;`;
  const rows = await pool.query(sql, pet_tag_id);
  return rows[0];
};

// sql - 關鍵字列表
const getKeywordData = async () => {
  const sql = "SELECT * FROM keywords;";
  const rows = await pool.query(sql);
  return rows[0];
};
// const keywordList = await getKeywordData();

// sql - 商品說明
const getProductIntros = async (products) => {
  const productIds = products.map((p) => p.id);
  const sql = `
    SELECT intro_type, intro_text
    FROM product_intros
    WHERE prod_id_fk = ?
    ORDER BY id;
  `;
  for (const productId in productIds) {
    const rows = (await pool.query(sql, 1))[0];
    const result = rows.reduce((obj, item) => {
      obj[item.intro_type] = item.intro_text;
      return obj;
    }, {});
    products[productId] = { ...products[productId], intros: result };
  }
  return products;
};

// sql - 商品縮圖
const getProductAvatars = async (products) => {
  const productIds = products.map((p) => p.id);
  const sql = `
    SELECT src, thumbnail, avatar_order
    FROM product_avatars
    WHERE prod_id_fk = ?
    ORDER BY id;
  `;
  for (const productId in productIds) {
    const rows = (await pool.query(sql, 1))[0];
    products[productId] = { ...products[productId], avatars: rows };
  }
  return products;
};

// sql - 商品介紹圖
const getProductImages = async (products) => {
  const productIds = products.map((p) => p.id);
  const sql = `
    SELECT src, image_order
    FROM product_images
    WHERE prod_id_fk = ?
    ORDER BY id;
  `;
  for (const productId in productIds) {
    const rows = (await pool.query(sql, 1))[0];
    products[productId] = { ...products[productId], images: rows };
  }
  return products;
};

// sql - 品項關鍵字 + tags
const getItemDetails = async (itemList) => {
  if (!itemList.length) return [];

  const itemIds = itemList.map((item) => item.id);
  const sql_keyword = `
    SELECT DISTINCT item_id_fk, keyword_id_fk
    FROM item_keywords
    WHERE item_id_fk IN (?)
    ORDER BY item_id_fk, keyword_id_fk;
  `;
  const [keywordRows] = await pool.query(sql_keyword, [itemIds]);

  const keywordMap = {};
  for (const row of keywordRows) {
    if (!keywordMap[row.item_id_fk]) keywordMap[row.item_id_fk] = [];
    keywordMap[row.item_id_fk].push(row.keyword_id_fk);
  }

  const sql_tag = `
    SELECT DISTINCT item_id_fk, tag_id_fk
    FROM item_tags
    WHERE item_id_fk IN (?)
    ORDER BY item_id_fk, tag_id_fk;
  `;
  const [tagRows] = await pool.query(sql_tag, [itemIds]);

  const tagMap = {};
  for (const row of tagRows) {
    if (!tagMap[row.item_id_fk]) tagMap[row.item_id_fk] = [];
    tagMap[row.item_id_fk].push(row.tag_id_fk);
  }

  return itemList.map((item) => ({
    ...item,
    keywords_id: keywordMap[item.id] || [],
    tags_id: tagMap[item.id] || [],
  }));
};

// sql - 依商品(篩選後)讀取底下的所有品項
const attachItemsToProducts = async (products) => {
  const productIds = products.map((p) => p.id);
  const sql = `SELECT * FROM items WHERE prod_id_fk IN (?) ORDER BY prod_id_fk, id;`;
  let [itemRows] = await pool.query(sql, [productIds]);
  itemRows = await getItemDetails(itemRows);

  const itemMap = {};
  const keywordMap = {};
  const tagMap = {};
  for (const item of itemRows) {
    if (!itemMap[item.prod_id_fk]) {
      itemMap[item.prod_id_fk] = [];
      keywordMap[item.prod_id_fk] = [];
      tagMap[item.prod_id_fk] = [];
    }
    itemMap[item.prod_id_fk].push(item);
    item.keywords_id.map((k) => {
      if (!keywordMap[item.prod_id_fk].includes(k))
        keywordMap[item.prod_id_fk].push(k);
    });
    item.tags_id.map((k) => {
      if (!tagMap[item.prod_id_fk].includes(k)) tagMap[item.prod_id_fk].push(k);
    });
  }

  return products.map((product) => ({
    ...product,
    keywords_id: keywordMap[product.id] || [],
    tags_id: tagMap[product.id] || [],
    items: itemMap[product.id] || [],
  }));
};

// sql - 讀取商品列表
const getProductListData = async (filterOptions) => {
  const {
    petTypeId,
    selectedCategoryId,
    priceMin,
    priceMax,
    sort,
    currentPage,
  } = filterOptions;
  const perPage = 16;

  // 篩選條件
  const filters = [`WHERE p.pet_tag_id_fk=${petTypeId}`];
  if (selectedCategoryId) {
    filters.push(`category_id_fk=${selectedCategoryId}`);
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
    if (currentPage > totalPages) return { success: false };
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
    [rows] = await pool.query(sql, [(currentPage - 1) * perPage, perPage]);

    if (rows.length) {
      rows = await getProductIntros(rows);
      rows = await getProductAvatars(rows);
      rows = await getProductImages(rows);
      rows = await attachItemsToProducts(rows);
    }
  }

  return {
    success: true,
    totalRows,
    totalPages,
    products: rows,
  };
};

router.get("/", (req, res) => {
  return res.json({ success: true, page: "product" });
});

// 取得前端資訊
const getParams = (req) => {
  const petType = req.params.petType;
  const petTypeId = petTypeList.find((elem) => elem["tag_slug"] === petType).id;
  const selectedCategory = req.query.category ?? "";
  const selectedCategoryId = selectedCategory.length
    ? categoryList.find((elem) => elem["tag_slug"] === selectedCategory).id
    : 0;
  const selectedTags = req.query.tags
    ? req.query.tags.split(",").filter(Boolean)
    : [];
  const selectedKeywords = req.query.keywords
    ? req.query.keywords.split(" ").filter(Boolean)
    : [];
  const priceMin = +req.query["min-value"] || -1;
  const priceMax = +req.query["max-value"] || -1;
  const sort = req.query.sort ?? "default";
  const currentPage = +req.query.page || 1;
  return {
    petTypeId,
    selectedCategoryId,
    selectedTags,
    selectedKeywords,
    priceMin,
    priceMax,
    sort,
    currentPage,
  };
};

router.get("/:petType", async (req, res) => {
  const params = getParams(req);
  const categoriesCount = await countCategoryProduct(params.petTypeId);
  const productData = await getProductListData(params);
  res.json({
    success: true,
    params,
    categories: categoriesCount,
    productData,
  });
});

export default router;
