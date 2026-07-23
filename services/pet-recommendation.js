// 寵物 AI 導購的資料整理與商品篩選服務。
// 這個檔案只讀取資料庫，不會新增、修改或刪除任何資料。

import pool from "../utils/connect-mysql.js";

/**
 * AI 導購限定使用的 18 項展示商品。
 *
 * 這只限制「寵物 AI 導購」的候選範圍，
 * 不會影響一般商品列表顯示其他商品。
 */
export const DEMO_PRODUCT_IDS = Object.freeze([
  4, 8, 10, 11, 12, 24, 25, 27, 29, 30, 31, 33, 34, 38, 41, 52, 53, 54,
]);

/**
 * 前端引導式對話可以傳送的需求代碼。
 *
 * categorySlugs 對應 product_category_tags.tag_slug。
 * health_based 不限制商品類別，而是優先依健康標籤找商品。
 */
export const GUIDED_NEEDS = Object.freeze({
  health_based: {
    label: "依健康狀況推薦",
    categorySlugs: [],
  },
  main_food: {
    label: "日常主食",
    categorySlugs: ["main-food"],
  },
  treat: {
    label: "零食與營養補充",
    categorySlugs: ["treat"],
  },
  care: {
    label: "保健與生活照護",
    categorySlugs: ["supplement", "supplies"],
  },
});

/**
 * 檢查前端傳來的 needCode 是否為允許的引導選項。
 */
export function isValidGuidedNeedCode(needCode) {
  return Object.hasOwn(GUIDED_NEEDS, needCode);
}

/**
 * 取得一隻屬於目前登入會員的寵物推薦資料。
 *
 * userId 來自 req.currentUser.id，不可由前端自行指定。
 * petId 是使用者在前端選擇的寵物。
 */
export async function getOwnedPetRecommendationContext(userId, petId) {
  /**
   * 第一個 SQL 查詢寵物基本資料。
   *
   * 同時確認：
   * 1. 寵物 ID 正確
   * 2. 寵物屬於目前登入會員
   * 3. 寵物沒有被軟刪除
   */
  const petSql = `
    SELECT
      p.id AS petId,
      p.pet_name AS petName,

      -- 寵物照片路徑，提供 AI 導購頁左側摘要卡使用。
      p.avatar_url AS avatarUrl,

      p.breed_text AS breed,
      DATE_FORMAT(p.birthday, '%Y-%m-%d') AS birthday,
      p.weight,
      p.special_note AS specialNote,

      species.option_code AS speciesCode,
      species.attr_option AS speciesLabel,

      activity.option_code AS activityLevelCode,
      activity.attr_option AS activityLevelLabel

    FROM pets AS p

    JOIN pet_attr_details AS species
      ON species.id = p.species_option_id_fk

    LEFT JOIN pet_attr_details AS activity
      ON activity.id = p.activity_level_option_id_fk

    WHERE p.id = ?
      AND p.user_id_fk = ?
      AND p.is_deleted = 0

    LIMIT 1;
  `;

  // 第一個 ? 放 petId，第二個 ? 放 userId。
  const [petRows] = await pool.query(petSql, [petId, userId]);
  const pet = petRows[0];

  /**
   * 找不到時回傳 null。
   *
   * 可能代表寵物不存在、已刪除或屬於其他會員。
   * 不區分原因，可避免洩漏其他會員的寵物資料。
   */
  if (!pet) {
    return null;
  }

  /**
   * 第二個 SQL 查詢健康情況與過敏食材。
   *
   * 這兩類是多選資料，所以存在 pet_selected_options。
   */
  const optionSql = `
    SELECT
      pa.group_code AS groupCode,
      pad.id AS optionId,
      pad.attr_option AS label,
      pad.option_code AS code

    FROM pet_selected_options AS selected

    JOIN pet_attributes AS pa
      ON pa.id = selected.option_group_id_fk

    JOIN pet_attr_details AS pad
      ON pad.id = selected.option_id_fk

    WHERE selected.pet_id_fk = ?
      AND pa.group_code IN (
        'health_condition',
        'allergy_ingredient'
      )

    ORDER BY pa.sort ASC, pad.sort_order ASC;
  `;

  const [optionRows] = await pool.query(optionSql, [petId]);

  /**
   * 從多選資料中挑出健康情況。
   * none 代表沒有特殊狀況，不交給推薦程式。
   */
  const healthConditions = optionRows.filter(
    (option) =>
      option.groupCode === "health_condition" && option.code !== "none",
  );

  /**
   * 從多選資料中挑出過敏食材。
   * none 代表沒有過敏食材，因此排除。
   */
  const allergyIngredients = optionRows.filter(
    (option) =>
      option.groupCode === "allergy_ingredient" && option.code !== "none",
  );

  return {
    ...pet,
    healthConditions,
    allergyIngredients,
  };
}

/**
 * 將 GROUP_CONCAT 產生的逗號文字轉回陣列。
 *
 * "低敏,腸胃養護" 會變成：
 * ["低敏", "腸胃養護"]
 */
function splitGroupConcat(value) {
  if (!value) {
    return [];
  }

  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

/**
 * 從固定 18 項商品中找出候選商品。
 *
 * petContext：
 * getOwnedPetRecommendationContext() 整理好的寵物資料。
 *
 * needCode：
 * 前端引導式對話選項，例如 health_based、main_food。
 */
export async function getPetCandidateProducts(petContext, needCode) {
  if (!petContext) {
    throw new Error("缺少寵物推薦資料");
  }

  if (!isValidGuidedNeedCode(needCode)) {
    throw new Error("不支援的導購需求");
  }

  const guidedNeed = GUIDED_NEEDS[needCode];

  // 取得健康情況在 pet_attr_details 中的選項 ID。
  const healthOptionIds = petContext.healthConditions.map(
    (condition) => condition.optionId,
  );

  // 取得過敏食材 option_code，用來對應 keywords.slug。
  const allergyCodes = petContext.allergyIngredients.map(
    (ingredient) => ingredient.code,
  );

  /**
   * SQL 的 IN (?) 不適合收到空陣列。
   *
   * 沒有健康情況時使用 -1，
   * 因為資料庫不會有 id = -1 的健康選項。
   */
  const healthIdsForSql = healthOptionIds.length > 0 ? healthOptionIds : [-1];

  let categoryFilter = "";
  let allergyFilter = "";

  /**
   * sqlValues 的順序必須和 SQL 中的 ? 完全一致。
   *
   * 第一個 ?：健康情況 IDs
   * 第二個 ?：固定 18 項商品 IDs
   * 第三個 ?：寵物物種 cat 或 dog
   */
  const sqlValues = [healthIdsForSql, DEMO_PRODUCT_IDS, petContext.speciesCode];

  /**
   * main_food、treat、care 需要限制商品分類。
   * health_based 則不限制分類。
   */
  if (guidedNeed.categorySlugs.length > 0) {
    categoryFilter = `
      AND category.tag_slug IN (?)
    `;

    sqlValues.push(guidedNeed.categorySlugs);
  }

  /**
   * 有過敏食材時才加入排除條件。
   */
  if (allergyCodes.length > 0) {
    /**
     * NOT EXISTS：
     * 如果品項具有任一過敏食材 keyword，就排除該品項。
     *
     * 這裡排除的是 item，不是整個 product。
     * 同商品只要還有安全口味，就仍可被推薦。
     */
    allergyFilter = `
      AND NOT EXISTS (
        SELECT 1

        FROM item_keywords AS allergy_item_keyword

        JOIN keywords AS allergy_keyword
          ON allergy_keyword.id =
            allergy_item_keyword.keyword_id_fk

        WHERE allergy_item_keyword.item_id_fk = item.id
          AND allergy_keyword.slug IN (?)
      )
    `;

    sqlValues.push(allergyCodes);
  }

  /**
   * 每一列代表一個符合條件且沒有過敏成分的商品品項。
   */
  const candidateSql = `
    SELECT
      product.id AS productId,
      product.prod_name AS productName,
      product.price,
      product.slug,

      pet_type.tag_slug AS petType,

      category.tag_slug AS categorySlug,
      category.tag_ch AS categoryLabel,

      item.id AS itemId,
      item.sku,
      item.item_name AS itemName,
      item.stock,

      (
        SELECT avatar.thumbnail

        FROM product_avatars AS avatar

        WHERE avatar.prod_id_fk = product.id

        ORDER BY
          avatar.avatar_order ASC,
          avatar.id ASC

        LIMIT 1
      ) AS image,

      (
        SELECT intro.intro_text

        FROM product_intros AS intro

        WHERE intro.prod_id_fk = product.id
          AND intro.intro_type = 'slogan'

        LIMIT 1
      ) AS slogan,

      (
        SELECT intro.intro_text

        FROM product_intros AS intro

        WHERE intro.prod_id_fk = product.id
          AND intro.intro_type = 'content'

        LIMIT 1
      ) AS description,

      GROUP_CONCAT(
        DISTINCT product_tag.tag_ch
        ORDER BY product_tag.id
        SEPARATOR ','
      ) AS tagLabels,

      GROUP_CONCAT(
        DISTINCT matched_health.attr_option
        ORDER BY matched_health.sort_order
        SEPARATOR ','
      ) AS matchedHealthLabels,

      COUNT(
        DISTINCT health_map.health_option_id_fk
      ) AS matchScore

    FROM products AS product

    JOIN product_pet_tags AS pet_type
      ON pet_type.id = product.pet_tag_id_fk

    JOIN product_category_tags AS category
      ON category.id = product.category_id_fk

    JOIN items AS item
      ON item.prod_id_fk = product.id

    LEFT JOIN item_tags AS item_tag
      ON item_tag.item_id_fk = item.id

    LEFT JOIN product_special_tags AS product_tag
      ON product_tag.id = item_tag.tag_id_fk

    LEFT JOIN pet_health_product_tags AS health_map
      ON health_map.product_special_tag_id_fk =
        item_tag.tag_id_fk
      AND health_map.health_option_id_fk IN (?)

    LEFT JOIN pet_attr_details AS matched_health
      ON matched_health.id =
        health_map.health_option_id_fk

    WHERE product.id IN (?)
      AND pet_type.tag_slug = ?
      AND item.stock > 0

      ${categoryFilter}
      ${allergyFilter}

    GROUP BY
      product.id,
      product.prod_name,
      product.price,
      product.slug,
      pet_type.tag_slug,
      category.tag_slug,
      category.tag_ch,
      item.id,
      item.sku,
      item.item_name,
      item.stock

    ORDER BY
      product.id ASC,
      item.id ASC;
  `;

  const [candidateRows] = await pool.query(candidateSql, sqlValues);

  /**
   * SQL 回傳的是品項資料，
   * 但前端最後需要顯示的是商品 ProductCard。
   *
   * Map 會把相同 productId 的品項整理到同一項商品。
   */
  const productMap = new Map();

  for (const row of candidateRows) {
    if (!productMap.has(row.productId)) {
      productMap.set(row.productId, {
        productId: row.productId,
        name: row.productName,
        price: Number(row.price),
        slug: row.slug,
        petType: row.petType,
        categorySlug: row.categorySlug,
        categoryLabel: row.categoryLabel,
        image: row.image || "",
        slogan: row.slogan || "",
        description: row.description || "",

        // Set 可以避免相同標籤重複。
        tags: new Set(),
        matchedHealthConditions: new Set(),

        // 健康需求符合分數。
        matchScore: 0,

        // 此寵物可以安全選擇的品項。
        safeItems: [],
      });
    }

    const product = productMap.get(row.productId);

    product.safeItems.push({
      itemId: row.itemId,
      sku: row.sku,
      name: row.itemName,
      stock: Number(row.stock),
    });

    for (const tag of splitGroupConcat(row.tagLabels)) {
      product.tags.add(tag);
    }

    for (const healthLabel of splitGroupConcat(row.matchedHealthLabels)) {
      product.matchedHealthConditions.add(healthLabel);
    }

    /**
     * 同商品可能有多種口味。
     * 使用健康符合分數最高的安全品項作為商品分數。
     */
    product.matchScore = Math.max(product.matchScore, Number(row.matchScore));
  }

  /**
   * 將 Map 轉成陣列。
   *
   * Set 無法直接轉成一般 JSON，
   * 因此 tags 和 matchedHealthConditions 也轉成陣列。
   */
  let products = [...productMap.values()].map((product) => ({
    ...product,
    tags: [...product.tags],
    matchedHealthConditions: [...product.matchedHealthConditions],
  }));

  /**
   * 使用者選擇「依健康狀況推薦」時：
   *
   * 有健康狀況：
   * 只保留至少符合一項健康需求的商品。
   *
   * 沒有健康狀況：
   * 改用該物種的日常主食。
   */
  if (needCode === "health_based") {
    if (healthOptionIds.length > 0) {
      products = products.filter((product) => product.matchScore > 0);
    } else {
      products = products.filter(
        (product) => product.categorySlug === "main-food",
      );
    }
  }

  /**
   * 建立固定商品順序。
   *
   * 健康符合分數相同時，
   * 按照 DEMO_PRODUCT_IDS 中的順序排列。
   */
  const productOrder = new Map(
    DEMO_PRODUCT_IDS.map((productId, index) => [productId, index]),
  );

  products.sort((firstProduct, secondProduct) => {
    const scoreDifference = secondProduct.matchScore - firstProduct.matchScore;

    if (scoreDifference !== 0) {
      return scoreDifference;
    }

    return (
      productOrder.get(firstProduct.productId) -
      productOrder.get(secondProduct.productId)
    );
  });

  // 前端一次最多顯示三張商品卡。
  return products.slice(0, 3);
}
