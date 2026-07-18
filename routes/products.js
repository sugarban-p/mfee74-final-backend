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
  const sql = `
    SELECT pct.*, COUNT(p.id) AS catCount
    FROM product_category_tags pct
    INNER JOIN products p ON p.category_id_fk = pct.id
    WHERE p.pet_tag_id_fk = ?
    GROUP BY pct.id, pct.tag_code, pct.tag_ch, pct.tag_slug
    ORDER BY pct.id;
  `;
  const rows = await pool.query(sql, [pet_tag_id]);
  return rows[0];
};

// sql - 關鍵字列表
const getKeywordData = async (keywordList = []) => {
  let sql = "SELECT * FROM keywords;";
  const sqlValues = [];
  if (keywordList.length) {
    sql = "SELECT * FROM keywords WHERE id IN (?) ORDER BY id;";
    sqlValues.push(keywordList);
  }
  const rows = await pool.query(sql, sqlValues);
  return rows[0];
};

// sql - 商品標籤列表
const getTagData = async (tagList = []) => {
  let sql = "SELECT * FROM product_special_tags;";
  const sqlValues = [];
  if (tagList.length) {
    sql = "SELECT * FROM product_special_tags WHERE id IN (?) ORDER BY id;";
    sqlValues.push(tagList);
  }
  const rows = await pool.query(sql, sqlValues);
  return rows[0];
};

// sql - 商品說明
const getProductIntroMap = async (productIds) => {
  const sql = `
    SELECT prod_id_fk, intro_type, intro_text
    FROM product_intros
    WHERE prod_id_fk IN (?)
    ORDER BY prod_id_fk, id;
  `;
  const [introRows] = await pool.query(sql, [productIds]);
  const introMap = {};
  for (const row of introRows) {
    if (!introMap[row.prod_id_fk]) introMap[row.prod_id_fk] = {};
    introMap[row.prod_id_fk][row.intro_type] = row.intro_text;
  }
  return introMap;
};

// sql - 商品縮圖
const getProductAvatarMap = async (productIds) => {
  const sql = `
    SELECT prod_id_fk, src, thumbnail, avatar_order
    FROM product_avatars
    WHERE prod_id_fk IN (?)
    ORDER BY prod_id_fk, id;
  `;
  const [avatarRows] = await pool.query(sql, [productIds]);
  const avatarMap = {};
  for (const row of avatarRows) {
    if (!avatarMap[row.prod_id_fk]) avatarMap[row.prod_id_fk] = [];
    avatarMap[row.prod_id_fk].push({
      src: row.src,
      thumbnail: row.thumbnail,
      avatar_order: row.avatar_order,
    });
  }
  return avatarMap;
};

// sql - 商品介紹圖
const getProductImageMap = async (productIds) => {
  const sql = `
    SELECT prod_id_fk, src, image_order
    FROM product_images
    WHERE prod_id_fk IN (?)
    ORDER BY prod_id_fk, id;
  `;
  const [imageRows] = await pool.query(sql, [productIds]);
  const imageMap = {};
  for (const row of imageRows) {
    if (!imageMap[row.prod_id_fk]) imageMap[row.prod_id_fk] = [];
    imageMap[row.prod_id_fk].push({
      src: row.src,
      image_order: row.image_order,
    });
  }
  return imageMap;
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
const getProductItemMap = async (productIds) => {
  const sql = `SELECT * FROM items WHERE prod_id_fk IN (?) ORDER BY prod_id_fk, id;`;
  let [itemRows] = await pool.query(sql, [productIds]);
  itemRows = await getItemDetails(itemRows);

  const itemDataMap = {};
  for (const item of itemRows) {
    if (!itemDataMap[item.prod_id_fk]) {
      itemDataMap[item.prod_id_fk] = {
        keywords_id: [],
        tags_id: [],
        items: [],
      };
    }
    const itemData = itemDataMap[item.prod_id_fk];
    itemData.items.push(item);
    for (const keywordId of item.keywords_id) {
      if (!itemData.keywords_id.includes(keywordId)) {
        itemData.keywords_id.push(keywordId);
      }
    }
    for (const tagId of item.tags_id) {
      if (!itemData.tags_id.includes(tagId)) itemData.tags_id.push(tagId);
    }
  }
  return itemDataMap;
};

// sql - 讀取商品列表
const getProductListData = async (filterOptions) => {
  const {
    petTypeId,
    selectedCategoryId,
    selectedTags = [],
    selectedKeywords = [],
    priceMin,
    priceMax,
    sort,
    currentPage,
  } = filterOptions;
  const perPage = 16;

  // 篩選條件
  const filters = ["p.pet_tag_id_fk = ?"];
  const sqlValues = [petTypeId];
  if (selectedCategoryId) {
    filters.push("p.category_id_fk = ?");
    sqlValues.push(selectedCategoryId);
  }
  if (priceMin > 0) {
    filters.push("p.price >= ?");
    sqlValues.push(priceMin);
  }
  if (priceMax > 0) {
    filters.push("p.price <= ?");
    sqlValues.push(priceMax);
  }
  if (selectedTags.length) {
    filters.push(`
      EXISTS (
        SELECT 1
        FROM items tag_i
        INNER JOIN item_tags it ON it.item_id_fk = tag_i.id
        WHERE tag_i.prod_id_fk = p.id AND it.tag_id_fk IN (?)
      )
    `);
    sqlValues.push(selectedTags);
  }
  for (const keywordId of selectedKeywords) {
    filters.push(`
      EXISTS (
        SELECT 1
        FROM items keyword_i
        INNER JOIN item_keywords ik ON ik.item_id_fk = keyword_i.id
        WHERE keyword_i.prod_id_fk = p.id AND ik.keyword_id_fk = ?
      )
    `);
    sqlValues.push(keywordId);
  }
  const sql_filter = `WHERE ${filters.join(" AND ")}`;

  // 讀取商品與品項資料後再計算 pagination
  let totalRows = 0;
  let totalPages = 0;
  let rows = [];
  let keywordList = [];
  let keywordData = [];
  let tagList = [];
  let tagData = [];
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
      `;
  [rows] = await pool.query(sql, sqlValues);

  if (rows.length) {
    totalRows = rows.length;
    totalPages = Math.ceil(totalRows / perPage);
    if (currentPage > totalPages) {
      return {
        success: false,
        totalRows,
        totalPages,
        keywordData,
        tagData,
        products: [],
      };
    }

    const itemDataMap = await getProductItemMap(rows.map((p) => p.id));
    rows = rows.map((product) => {
      const itemData = itemDataMap[product.id] || {};
      return {
        ...product,
        keywords_id: itemData.keywords_id || [],
        tags_id: itemData.tags_id || [],
        items: itemData.items || [],
      };
    });

    if (rows.length) {
      const productIds = rows.map((p) => p.id);
      const [introMap, avatarMap, imageMap] = await Promise.all([
        getProductIntroMap(productIds),
        getProductAvatarMap(productIds),
        getProductImageMap(productIds),
      ]);
      rows = rows.map((product) => ({
        ...product,
        intros: introMap[product.id] || {},
        avatars: avatarMap[product.id] || [],
        images: imageMap[product.id] || [],
      }));
    }

    keywordList = rows.reduce((obj, item) => {
      for (const keywordId of item.keywords_id) {
        if (!obj.includes(keywordId)) {
          obj.push(keywordId);
        }
      }
      return obj;
    }, []);

    if (keywordList.length) {
      keywordData = await getKeywordData(keywordList);
    }

    tagList = rows.reduce((obj, item) => {
      for (const tagId of item.tags_id) {
        if (!obj.includes(tagId)) {
          obj.push(tagId);
        }
      }
      return obj;
    }, []);

    if (tagList.length) {
      tagData = await getTagData(tagList);
    }

    rows = rows.slice((currentPage - 1) * perPage, currentPage * perPage);
  }

  return {
    success: true,
    totalRows,
    totalPages,
    keywordData,
    tagData,
    products: rows,
  };
};

router.get("/", (req, res) => {
  return res.json({ success: true, page: "product" });
});

// 取得前端資訊
const getParams = (req) => {
  const petType = req.params.petType;
  const petTypeData = /^\d+$/.test(petType)
    ? petTypeList.find((elem) => elem.id === +petType)
    : petTypeList.find((elem) => elem["tag_slug"] === petType);
  if (!petTypeData) return null;

  const selectedCategory = req.query.category ?? "";
  const categoryData = /^\d+$/.test(selectedCategory)
    ? categoryList.find((elem) => elem.id === +selectedCategory)
    : categoryList.find((elem) => elem["tag_slug"] === selectedCategory);
  const priceMin = +req.query["min-value"] || -1;
  const priceMax = +req.query["max-value"] || -1;
  const sort = sortList[req.query.sort] ? req.query.sort : "default";
  const currentPage = parsePositiveInt(req.query.page, 1);
  return {
    petTypeId: petTypeData.id,
    selectedCategoryId: categoryData?.id || 0,
    selectedTags: parseIdList(req.query.tags),
    selectedKeywords: parseIdList(req.query.keywords),
    priceMin,
    priceMax,
    sort,
    currentPage,
  };
};

const parsePositiveInt = (value, defaultValue) => {
  const number = +value;
  return Number.isInteger(number) && number > 0 ? number : defaultValue;
};

const parseIdList = (value) =>
  [
    ...new Set(
      (Array.isArray(value) ? value.join(",") : `${value ?? ""}`)
        .split(/[,\s]+/)
        .map((id) => +id)
        .filter((id) => Number.isInteger(id) && id > 0),
    ),
  ];

router.get("/:petType", async (req, res) => {
  const params = getParams(req);
  if (!params) return res.status(400).json({ success: false });

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
