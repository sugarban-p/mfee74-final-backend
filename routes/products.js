// 商品管理 API

import { Router } from "express";
import pool from "../utils/connect-mysql.js";
import { getSessionUser, requireAuth } from "../utils/auth-session.js";

const router = Router();

// 排序選項 對照 sql
const sortList = {
  default: "total_sold DESC",
  latest: "p.created_at DESC",
  price_asc: "p.price ASC",
  price_desc: "p.price DESC",
};

const parseIdList = (value) => {
  if (!value) return [];
  return String(value)
    .split(",")
    .map((id) => Number(id))
    .filter((id) => Number.isInteger(id) && id > 0);
};

const parseNumber = (value, defaultValue) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : defaultValue;
};

const parseJsonArray = (value) => {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  return JSON.parse(value);
};

const summarizeItemTags = (items) => {
  const tags = new Map();
  for (const item of items) {
    for (const tag of parseJsonArray(item.tags)) {
      const id = tag.id ?? tag.tag_id;
      if (id && !tags.has(id)) {
        tags.set(id, { id, tag_ch: tag.tag_ch, tag_slug: tag.tag_slug });
      }
    }
  }
  return [...tags.values()];
};

const buildProductTagMaps = (petTypeList, categoryList) => ({
  petTypes: new Map(
    petTypeList.map(({ id, tag_page, tag_slug }) => [
      id,
      { id, tag_page, tag_slug },
    ]),
  ),
  categories: new Map(
    categoryList.map(({ id, tag_ch, tag_slug }) => [
      id,
      { id, tag_ch, tag_slug },
    ]),
  ),
});

const formatProductTags = (product, tagMaps) => {
  if (!product) return product;

  const { pet_tag_id_fk, category_id_fk, ...productData } = product;
  return {
    ...productData,
    petType: tagMaps.petTypes.get(pet_tag_id_fk) || null,
    category: tagMaps.categories.get(category_id_fk) || null,
  };
};

const getOptionalUserId = async (req) => {
  const user = await getSessionUser(req);
  return user?.id || null;
};

// sql - 寵物類別列表
const getPetTypeData = async () => {
  const sql = "SELECT * FROM product_pet_tags;";
  const [rows] = await pool.query(sql);
  return rows;
};

// sql - 商品類別列表
const getCategoryData = async () => {
  const sql = "SELECT * FROM product_category_tags;";
  const [rows] = await pool.query(sql);
  return rows;
};

router.use(async (req, res, next) => {
  req.petTypeList = await getPetTypeData();
  req.categoryList = await getCategoryData();
  next();
});

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
  const [rows] = await pool.query(sql, [pet_tag_id]);
  return rows;
};

// sql - 讀取指定商品說明文字
const getProductIntroMap = async (productIds, sloganOnly = false) => {
  const filter = sloganOnly ? " AND intro_type = 'slogan' " : "";
  const sql = `
    SELECT prod_id_fk, intro_type, intro_text
    FROM product_intros
    WHERE prod_id_fk IN (?) ${filter}
    ORDER BY prod_id_fk;`;
  const [introRows] = await pool.query(sql, [productIds]);
  const introMap = introRows.reduce((obj, row) => {
    if (!obj[row.prod_id_fk]) obj[row.prod_id_fk] = {};
    obj[row.prod_id_fk][row.intro_type] = row.intro_text;
    return obj;
  }, {});
  return introMap;
};

// sql - 讀取指定商品縮圖
const getProductAvatarMap = async (productIds, firstOnly = false) => {
  const filter = firstOnly ? " AND avatar_order = 1 " : "";
  const sql = `
    SELECT prod_id_fk, src, thumbnail, avatar_order
    FROM product_avatars
    WHERE prod_id_fk IN (?) ${filter}
    ORDER BY prod_id_fk;
  `;
  const [avatarRows] = await pool.query(sql, [productIds]);
  const avatarMap = avatarRows.reduce((obj, row) => {
    if (!obj[row.prod_id_fk]) obj[row.prod_id_fk] = [];
    const { prod_id_fk, ...newRow } = row;
    obj[row.prod_id_fk].push(newRow);
    return obj;
  }, {});
  return avatarMap;
};

// sql - 讀取商品介紹圖(詳細頁用)
const getProductImage = async (productId) => {
  const sql = `
    SELECT src, image_order
    FROM product_images
    WHERE prod_id_fk = ?
    ORDER BY image_order;
  `;
  const [imageRows] = await pool.query(sql, [productId]);
  return imageRows;
};

// sql - 自由文字搜尋條件
const searchFilters = [
  "p.prod_name LIKE ?",
  `
    EXISTS (
      SELECT 1
      FROM items search_i
      WHERE search_i.prod_id_fk = p.id AND search_i.item_name LIKE ?
    )
  `,
  `
    EXISTS (
      SELECT 1
      FROM items search_keyword_i
      INNER JOIN item_keywords search_ik ON search_ik.item_id_fk = search_keyword_i.id
      INNER JOIN keywords search_k ON search_k.id = search_ik.keyword_id_fk
      WHERE search_keyword_i.prod_id_fk = p.id AND search_k.keyword LIKE ?
    )
  `,
  `
    EXISTS (
      SELECT 1
      FROM items search_tag_i
      INNER JOIN item_tags search_it ON search_it.item_id_fk = search_tag_i.id
      INNER JOIN product_special_tags search_pst ON search_pst.id = search_it.tag_id_fk
      WHERE search_tag_i.prod_id_fk = p.id AND search_pst.tag_ch LIKE ?
    )
  `,
];
const buildSearchFilter = (search) => {
  if (!search) return null;

  const likeSearch = `%${search}%`;
  return {
    sql: `(${searchFilters.join(" OR ")})`,
    values: searchFilters.map(() => likeSearch),
  };
};

const buildProductFilters = (filterOptions) => {
  const {
    petTypeId,
    categoryId = 0,
    priceMin = -1,
    priceMax = -1,
    tagIds = [],
    search,
  } = filterOptions;

  const filters = ["p.pet_tag_id_fk = ?"];
  const sqlValues = [petTypeId];

  if (categoryId) {
    filters.push("p.category_id_fk = ?");
    sqlValues.push(categoryId);
  }
  if (priceMin > 0) {
    filters.push("p.price >= ?");
    sqlValues.push(priceMin);
  }
  if (priceMax > 0) {
    filters.push("p.price <= ?");
    sqlValues.push(priceMax);
  }
  if (tagIds.length) {
    filters.push(`
      EXISTS (
        SELECT 1
        FROM items tag_i
        INNER JOIN item_tags it ON it.item_id_fk = tag_i.id
        WHERE tag_i.prod_id_fk = p.id AND it.tag_id_fk IN (?)
      )
    `);
    sqlValues.push(tagIds);
  }

  const searchFilter = buildSearchFilter(search);
  if (searchFilter) {
    filters.push(searchFilter.sql);
    sqlValues.push(...searchFilter.values);
  }

  return {
    sql: `WHERE ${filters.join(" AND ")}`,
    values: sqlValues,
  };
};

// sql - 讀取篩選後商品的 tag facets
const getTagFacets = async (sqlFilter, sqlValues) => {
  const sql = `
    SELECT DISTINCT
      pst.id,
      pst.tag_ch,
      pst.tag_slug
    FROM products p
    INNER JOIN items i ON i.prod_id_fk = p.id
    INNER JOIN item_tags it ON it.item_id_fk = i.id
    INNER JOIN product_special_tags pst ON pst.id = it.tag_id_fk
    ${sqlFilter}
    ORDER BY pst.id;
  `;
  const [rows] = await pool.query(sql, sqlValues);
  return rows;
};

// sql - 讀取 品項符合篩選條件 的商品 (列表頁)
const getProductMap = async (
  filterOptions,
  sort = "default",
  page = 1,
  tagMaps,
  userId = null,
) => {
  const perPage = 16;
  const currentPage = Math.max(1, Math.floor(Number(page) || 1));
  const offset = (currentPage - 1) * perPage;

  // 篩選條件
  const { sql: sqlFilter, values: sqlValues } =
    buildProductFilters(filterOptions);
  const sqlSort = `ORDER BY ${sortList[sort] || sortList.default}, p.id ASC`;
  const countSql = `
      SELECT COUNT(DISTINCT p.id) AS totalRows
      FROM products p
      ${sqlFilter};
    `;
  const [[countData]] = await pool.query(countSql, sqlValues);
  const tags = await getTagFacets(sqlFilter, sqlValues);
  const totalRows = countData.totalRows;
  const totalPages = Math.ceil(totalRows / perPage);
  const pagination = {
    currentPage,
    perPage,
    totalRows,
    totalPages,
  };

  const productSql = `
    SELECT
      p.id AS id,
      p.prod_name,
      p.pet_tag_id_fk,
      p.category_id_fk,
      p.price,
      p.slug,
      p.created_at,
      COALESCE(item_stats.total_sold, 0) AS total_sold,
      COALESCE(item_stats.total_stock, 0) AS total_stock,
      EXISTS (
        SELECT 1
        FROM user_favorites uf
        WHERE uf.user_id_fk = ? AND uf.prod_id_fk = p.id
      ) AS isFavorite,
      COALESCE(
        (
          SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
              'item_id', i.id,
              'item_name', i.item_name,
              'sku', i.sku,
              'sold', i.sold,
              'stock', i.stock,
              'tags', COALESCE(
                (
                  SELECT JSON_ARRAYAGG(
                    JSON_OBJECT(
                      'id', pst.id,
                      'tag_ch', pst.tag_ch,
                      'tag_slug', pst.tag_slug
                    )
                  )
                  FROM item_tags it
                  INNER JOIN product_special_tags pst ON pst.id = it.tag_id_fk
                  WHERE it.item_id_fk = i.id
                ),
                JSON_ARRAY()
              )
            )
          )
          FROM items i
          WHERE i.prod_id_fk = p.id
        ),
        JSON_ARRAY()
      ) AS items
    FROM products p
    LEFT JOIN (
      SELECT
        prod_id_fk,
        SUM(sold) AS total_sold,
        SUM(stock) AS total_stock
      FROM items
      GROUP BY prod_id_fk
    ) item_stats ON item_stats.prod_id_fk = p.id
    ${sqlFilter}
    ${sqlSort}
    LIMIT ? OFFSET ?;
  `;
  const [productRows] = await pool.query(productSql, [
    userId,
    ...sqlValues,
    perPage,
    offset,
  ]);
  const productIds = productRows.map((product) => product.id);
  const [introMap, avatarMap] = productIds.length
    ? await Promise.all([
        getProductIntroMap(productIds, true),
        getProductAvatarMap(productIds, true),
      ])
    : [{}, {}];

  return {
    facets: { tags },
    pagination,
    products: productRows.map((product) => {
      const items = parseJsonArray(product.items);
      const { isFavorite, ...productFields } = product;
      const productData = formatProductTags(productFields, tagMaps);
      return {
        ...productData,
        isFavorite: Boolean(isFavorite),
        intro: introMap[product.id] || {},
        avatar: avatarMap[product.id]?.[0] || null,
        tags: summarizeItemTags(items),
        items,
      };
    }),
  };
};

// sql - 讀取指定商品 (選購)
const getProduct = async (productId, userId = null) => {
  const sql = `
    SELECT
      p.*,
      EXISTS (
        SELECT 1
        FROM user_favorites uf
        WHERE uf.user_id_fk = ? AND uf.prod_id_fk = p.id
      ) AS isFavorite
    FROM products p
    WHERE p.id = ?
    ;
  `;
  const [[productRow]] = await pool.query(sql, [userId, productId]);
  if (productRow) productRow.isFavorite = Boolean(productRow.isFavorite);
  return productRow;
};

// sql - 讀取商品底下品項 (選購)
const getProductItem = async (productId) => {
  const sql = `
    SELECT 
      i.id, i.sku, i.item_name, i.sold, i.stock,
      IF(
        COUNT(pst.id) = 0,
        JSON_ARRAY(),
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'tag_id', pst.id,
            'tag_ch', pst.tag_ch,
            'tag_slug', pst.tag_slug
          )
        )
      ) AS tags
    FROM items i
    LEFT JOIN item_tags it 
      ON it.item_id_fk = i.id
    LEFT JOIN product_special_tags pst 
      ON pst.id = it.tag_id_fk
    WHERE i.prod_id_fk = ?
    GROUP BY i.id, i.sku, i.prod_id_fk, i.item_name, i.sold, i.stock
    ORDER BY i.prod_id_fk, i.id;
  `;
  const [itemRows] = await pool.query(sql, productId);
  return itemRows;
};

// 統計 銷量 & 存貨
const sumItemDetail = (items) => {
  const result = {
    totalSold: 0,
    totalStock: 0,
  };
  for (const item of items) {
    result.totalSold += item.sold;
    result.totalStock += item.stock;
  }
  return result;
};

router.get("/", async (req, res) => {
  return res.json({
    success: true,
    page: "product",
  });
});

router.get("/mega-menu", async (req, res) => {
  try {
    const cards = await Promise.all(
      req.petTypeList.map(async (petType) => {
        const categories = await countCategoryProduct(petType.id);
        const title = petType.tag_page || `${petType.tag_ch}專區`;

        return {
          id: petType.id,
          petType: petType.tag_slug,
          imageAlt: title,
          title,
          href: `/product/${petType.tag_slug}`,
          items: categories.map((category) => ({
            id: category.id,
            title: category.tag_ch,
            href: `/product/${petType.tag_slug}?category=${category.tag_slug}`,
          })),
        };
      }),
    );

    return res.json({ success: true, cards });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "讀取商品選單失敗",
    });
  }
});

// 讀取收藏列表 `user_favorites`
const getFavoriteListData = async (userId) => {
  const [rows] = await pool.query(
    `
      SELECT
        uf.id AS favorite_id,
        uf.created_at AS favorited_at,
        p.*,
        COALESCE(item_stats.total_sold, 0) AS total_sold,
        COALESCE(item_stats.total_stock, 0) AS total_stock
      FROM user_favorites uf
      INNER JOIN products p ON p.id = uf.prod_id_fk
      LEFT JOIN (
        SELECT
          prod_id_fk,
          SUM(sold) AS total_sold,
          SUM(stock) AS total_stock
        FROM items
        GROUP BY prod_id_fk
      ) item_stats ON item_stats.prod_id_fk = p.id
      WHERE uf.user_id_fk = ?
      ORDER BY uf.created_at DESC, uf.id DESC;
    `,
    [userId],
  );

  return getProductsWithDetails(rows);
};
router.get("/getFavorite", requireAuth, async (req, res) => {
  const userId = req.currentUser.id;

  try {
    const favorites = await getFavoriteListData(userId);

    return res.json({ success: true, favorites });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "讀取收藏列表失敗",
    });
  }
});

// 新增/取消 收藏商品 `user_favorites`
router.patch("/updateFavorite/:productId", requireAuth, async (req, res) => {
  const userId = req.currentUser.id;
  const productId = +req.params.productId;
  const isFavorite = req.body.favorite; // Boolean (true=收藏，false=取消收藏)

  if (
    !Number.isInteger(productId) ||
    productId <= 0 ||
    typeof isFavorite !== "boolean"
  ) {
    return res.status(400).json({
      success: false,
      message: "商品或收藏狀態格式錯誤",
    });
  }

  try {
    if (isFavorite) {
      await pool.query(
        `
          INSERT INTO user_favorites (user_id_fk, prod_id_fk)
          VALUES (?, ?)
          ON DUPLICATE KEY UPDATE prod_id_fk = prod_id_fk;
        `,
        [userId, productId],
      );
    } else {
      await pool.query(
        `
          DELETE FROM user_favorites
          WHERE user_id_fk = ? AND prod_id_fk = ?;
        `,
        [userId, productId],
      );
    }

    return res.json({ success: true, favorite: isFavorite });
  } catch (err) {
    if (err.code === "ER_NO_REFERENCED_ROW_2") {
      return res.status(404).json({
        success: false,
        message: "找不到商品",
      });
    }

    console.error(err);
    return res.status(500).json({
      success: false,
      message: "更新收藏失敗",
    });
  }
});

// 讀取購物車
router.get("/getCart", requireAuth, async (req, res) => {
  const userId = req.currentUser.id;

  try {
    const [cartItems] = await pool.query(
      `
        SELECT
          ci.id AS cart_id,
          ci.sku_id_fk AS item_id,
          ci.quantity,
          ci.is_selected,
          i.sku,
          i.item_name,
          i.stock,
          p.id AS product_id,
          p.prod_name,
          p.slug,
          p.price,
          p.price * ci.quantity AS subtotal,
          (
            SELECT pa.src
            FROM product_avatars pa
            WHERE pa.prod_id_fk = p.id
            ORDER BY pa.avatar_order, pa.id
            LIMIT 1
          ) AS avatar
        FROM cart_items ci
        INNER JOIN items i ON i.id = ci.sku_id_fk
        INNER JOIN products p ON p.id = i.prod_id_fk
        WHERE ci.user_id_fk = ?
        ORDER BY ci.updated_at DESC, ci.id DESC;
      `,
      [userId],
    );

    return res.json({
      success: true,
      cartItems,
      totalAmount: cartItems.reduce(
        (sum, item) => sum + Number(item.subtotal),
        0,
      ),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "讀取購物車失敗",
    });
  }
});

// 新增/修改品項數量 到 購物車 `cart_items`
router.post("/updateCart/:itemId", requireAuth, async (req, res) => {
  const userId = req.currentUser.id;

  const itemId = +req.params.itemId;
  const qty = +req.body.qty; // 修改後的數量（absolute quantity），不是變動量（delta）

  if (
    !Number.isInteger(itemId) ||
    itemId <= 0 ||
    !Number.isInteger(qty) ||
    qty <= 0
  ) {
    return res.status(400).json({
      success: false,
      message: "品項或數量格式錯誤",
    });
  }

  try {
    await pool.query(
      `
        INSERT INTO cart_items (user_id_fk, sku_id_fk, quantity)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE quantity = ?;
      `,
      [userId, itemId, qty, qty],
    );

    return res.json({ success: true });
  } catch (err) {
    if (err.code === "ER_NO_REFERENCED_ROW_2") {
      return res.status(404).json({
        success: false,
        message: "找不到品項",
      });
    }

    console.error(err);
    return res.status(500).json({
      success: false,
      message: "更新購物車失敗",
    });
  }
});

// 移除 購物車品項 `cart_items`
router.delete("/updateCart/:itemId", requireAuth, async (req, res) => {
  const userId = req.currentUser.id;

  const itemId = +req.params.itemId;

  if (!Number.isInteger(itemId) || itemId <= 0) {
    return res.status(400).json({
      success: false,
      message: "品項格式錯誤",
    });
  }

  try {
    await pool.query(
      `
        DELETE FROM cart_items
        WHERE user_id_fk = ? AND sku_id_fk = ?;
      `,
      [userId, itemId],
    );

    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "移除購物車品項失敗",
    });
  }
});

// 商品快速選購頁
router.get("/:petTypeId/:productId/buy", async (req, res) => {
  const petTypeId = req.params.petTypeId;
  const productId = req.params.productId;
  const userId = await getOptionalUserId(req);
  const product = await getProduct(productId, userId);
  const items = await getProductItem(productId);
  const { totalSold, totalStock } = sumItemDetail(items);
  const avatarResult = await getProductAvatarMap(productId);
  const [avatars] = Object.values(avatarResult);
  const tagMaps = buildProductTagMaps(req.petTypeList, req.categoryList);
  res.json({
    params: { petTypeId, productId },
    product: {
      ...formatProductTags(product, tagMaps),
      totalSold: totalSold,
      totalStock: totalStock,
      tags: summarizeItemTags(items),
    },
    items,
    avatars,
  });
});

// 商品詳細頁
router.get("/:petTypeId/:productId/detail", async (req, res) => {
  const petTypeId = req.params.petTypeId;
  const productId = req.params.productId;
  const userId = await getOptionalUserId(req);
  const product = await getProduct(productId, userId);
  const items = await getProductItem(productId);
  const { totalSold, totalStock } = sumItemDetail(items);
  const avatarResult = await getProductAvatarMap(productId);
  const [avatars] = Object.values(avatarResult);
  const images = await getProductImage(productId);
  const tagMaps = buildProductTagMaps(req.petTypeList, req.categoryList);
  res.json({
    params: { petTypeId, productId },
    product: {
      ...formatProductTags(product, tagMaps),
      totalSold: totalSold,
      totalStock: totalStock,
      tags: summarizeItemTags(items),
    },
    items,
    avatars,
    images,
  });
});

// 商品列表頁
router.get("/:petTypeId", async (req, res) => {
  const petTypeId = req.params.petTypeId;
  const userId = await getOptionalUserId(req);
  const categoriesCount = await countCategoryProduct(petTypeId);
  const search =
    typeof req.query.search === "string" ? req.query.search.trim() : "";
  const tagMaps = buildProductTagMaps(req.petTypeList, req.categoryList);
  const { facets, pagination, products } = await getProductMap(
    {
      petTypeId: parseNumber(petTypeId, 0),
      categoryId: parseNumber(req.query.categoryId ?? req.query.category, 0),
      priceMin: parseNumber(req.query.priceMin ?? req.query["min-value"], -1),
      priceMax: parseNumber(req.query.priceMax ?? req.query["max-value"], -1),
      tagIds: parseIdList(req.query.tagIds ?? req.query.tags),
      search,
    },
    req.query.sort,
    req.query.page,
    tagMaps,
    userId,
  );

  res.json({
    success: true,
    petTypeId,
    facets: { categories: categoriesCount, tags: facets.tags },
    pagination,
    products,
  });
});

export default router;
