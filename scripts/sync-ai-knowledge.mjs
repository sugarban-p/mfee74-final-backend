// Functionality: sync product documents from MySQL into ai_knowledge_docs and export JSON.
// Purpose: prepare a lightweight knowledge source for AI retrieval with minimal setup.

import "dotenv/config";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";

const {
  DB_HOST,
  DB_USER,
  DB_PASS,
  DB_NAME,
  DB_PORT,
  FRONTEND_AFTER_LOGIN_URL,
} = process.env;

const pool = mysql.createPool({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASS,
  port: Number(DB_PORT || 3306),
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 5,
});

const outputJsonPath = path.join(
  process.cwd(),
  "data",
  "ai",
  "mofu-knowledge.json",
);

const paymentMethodLabelMap = {
  credit: "信用卡",
  linepay: "LINE Pay",
  atm: "ATM 轉帳",
};

const orderStatusLabelMap = {
  1: "處理中",
  2: "已完成",
  3: "已取消",
  4: "退款中",
  5: "退貨中",
};

function normalizeText(value) {
  return String(value || "")
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function buildContentHash(doc) {
  const payload = [
    doc.doc_key,
    doc.source_type,
    doc.title,
    doc.summary || "",
    doc.content,
    doc.source_url || "",
    JSON.stringify(doc.tags || []),
    JSON.stringify(doc.metadata || {}),
  ].join("\n");

  return createHash("sha1").update(payload).digest("hex");
}

function getBaseUrl() {
  return String(FRONTEND_AFTER_LOGIN_URL || "http://localhost:3000")
    .replace("/member/dashboard", "")
    .replace(/\/$/, "");
}

function formatTopItems(rows, toLine) {
  if (!Array.isArray(rows) || rows.length === 0) return "目前尚無資料";
  return rows.map((row, index) => `${index + 1}. ${toLine(row)}`).join("\n");
}

async function hasTable(tableName) {
  const [rows] = await pool.execute(
    `
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = ? AND table_name = ?
      LIMIT 1
    `,
    [DB_NAME, tableName],
  );

  return rows.length > 0;
}

async function hasColumn(tableName, columnName) {
  const [rows] = await pool.execute(
    `
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = ? AND table_name = ? AND column_name = ?
      LIMIT 1
    `,
    [DB_NAME, tableName, columnName],
  );

  return rows.length > 0;
}

async function hasIndex(tableName, indexName) {
  const [rows] = await pool.execute(
    `
      SELECT 1
      FROM information_schema.statistics
      WHERE table_schema = ? AND table_name = ? AND index_name = ?
      LIMIT 1
    `,
    [DB_NAME, tableName, indexName],
  );

  return rows.length > 0;
}

async function addColumnIfMissing(tableName, columnName, definitionSql) {
  if (await hasColumn(tableName, columnName)) return;
  await pool.execute(
    `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definitionSql}`,
  );
}

async function addIndexIfMissing(tableName, indexName, indexSql) {
  if (await hasIndex(tableName, indexName)) return;
  await pool.execute(
    `ALTER TABLE ${tableName} ADD INDEX ${indexName} ${indexSql}`,
  );
}

async function addFulltextIndexIfMissing(tableName, indexName, indexSql) {
  if (await hasIndex(tableName, indexName)) return;
  await pool.execute(
    `ALTER TABLE ${tableName} ADD FULLTEXT INDEX ${indexName} ${indexSql}`,
  );
}

async function ensureKnowledgeTable() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS ai_knowledge_docs (
      id BIGINT NOT NULL AUTO_INCREMENT,
      doc_key VARCHAR(120) NOT NULL,
      source_type ENUM('FAQ', 'POLICY', 'PRODUCT') NOT NULL,
      source_system VARCHAR(40) NOT NULL DEFAULT 'db',
      source_table VARCHAR(64) DEFAULT NULL,
      source_pk VARCHAR(120) DEFAULT NULL,
      title VARCHAR(255) NOT NULL,
      summary TEXT DEFAULT NULL,
      content MEDIUMTEXT NOT NULL,
      content_hash CHAR(40) NOT NULL,
      source_url VARCHAR(500) DEFAULT NULL,
      locale VARCHAR(10) NOT NULL DEFAULT 'zh-TW',
      tags_json JSON DEFAULT NULL,
      metadata_json JSON DEFAULT NULL,
      priority INT NOT NULL DEFAULT 100,
      retrieval_weight DECIMAL(6, 3) NOT NULL DEFAULT 1.000,
      freshness_score DECIMAL(5, 2) NOT NULL DEFAULT 1.00,
      effective_from DATETIME DEFAULT NULL,
      effective_to DATETIME DEFAULT NULL,
      published_at DATETIME DEFAULT NULL,
      last_synced_at DATETIME DEFAULT NULL,
      version_no INT NOT NULL DEFAULT 1,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_ai_knowledge_doc_key (doc_key),
      KEY idx_ai_knowledge_source_ref (source_table, source_pk),
      KEY idx_ai_knowledge_locale (locale),
      KEY idx_ai_knowledge_priority (priority),
      KEY idx_ai_knowledge_weight (retrieval_weight),
      KEY idx_ai_knowledge_source_type (source_type),
      KEY idx_ai_knowledge_is_active (is_active),
      KEY idx_ai_knowledge_updated_at (updated_at),
      KEY idx_ai_knowledge_last_synced_at (last_synced_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await addColumnIfMissing(
    "ai_knowledge_docs",
    "source_system",
    "VARCHAR(40) NOT NULL DEFAULT 'db'",
  );
  await addColumnIfMissing(
    "ai_knowledge_docs",
    "source_table",
    "VARCHAR(64) DEFAULT NULL",
  );
  await addColumnIfMissing(
    "ai_knowledge_docs",
    "source_pk",
    "VARCHAR(120) DEFAULT NULL",
  );
  await addColumnIfMissing("ai_knowledge_docs", "summary", "TEXT DEFAULT NULL");
  await addColumnIfMissing(
    "ai_knowledge_docs",
    "content_hash",
    "CHAR(40) NOT NULL DEFAULT ''",
  );
  await addColumnIfMissing(
    "ai_knowledge_docs",
    "locale",
    "VARCHAR(10) NOT NULL DEFAULT 'zh-TW'",
  );
  await addColumnIfMissing(
    "ai_knowledge_docs",
    "metadata_json",
    "JSON DEFAULT NULL",
  );
  await addColumnIfMissing(
    "ai_knowledge_docs",
    "priority",
    "INT NOT NULL DEFAULT 100",
  );
  await addColumnIfMissing(
    "ai_knowledge_docs",
    "retrieval_weight",
    "DECIMAL(6, 3) NOT NULL DEFAULT 1.000",
  );
  await addColumnIfMissing(
    "ai_knowledge_docs",
    "freshness_score",
    "DECIMAL(5, 2) NOT NULL DEFAULT 1.00",
  );
  await addColumnIfMissing(
    "ai_knowledge_docs",
    "effective_from",
    "DATETIME DEFAULT NULL",
  );
  await addColumnIfMissing(
    "ai_knowledge_docs",
    "effective_to",
    "DATETIME DEFAULT NULL",
  );
  await addColumnIfMissing(
    "ai_knowledge_docs",
    "published_at",
    "DATETIME DEFAULT NULL",
  );
  await addColumnIfMissing(
    "ai_knowledge_docs",
    "last_synced_at",
    "DATETIME DEFAULT NULL",
  );
  await addColumnIfMissing(
    "ai_knowledge_docs",
    "version_no",
    "INT NOT NULL DEFAULT 1",
  );

  await addIndexIfMissing(
    "ai_knowledge_docs",
    "idx_ai_knowledge_source_ref",
    "(source_table, source_pk)",
  );
  await addIndexIfMissing(
    "ai_knowledge_docs",
    "idx_ai_knowledge_locale",
    "(locale)",
  );
  await addIndexIfMissing(
    "ai_knowledge_docs",
    "idx_ai_knowledge_priority",
    "(priority)",
  );
  await addIndexIfMissing(
    "ai_knowledge_docs",
    "idx_ai_knowledge_weight",
    "(retrieval_weight)",
  );
  await addIndexIfMissing(
    "ai_knowledge_docs",
    "idx_ai_knowledge_updated_at",
    "(updated_at)",
  );
  await addIndexIfMissing(
    "ai_knowledge_docs",
    "idx_ai_knowledge_last_synced_at",
    "(last_synced_at)",
  );
  await addFulltextIndexIfMissing(
    "ai_knowledge_docs",
    "ft_ai_knowledge_text",
    "(title, summary, content)",
  );
}

async function loadProductDocs() {
  const requiredTables = [
    "products",
    "product_intros",
    "product_pet_tags",
    "product_category_tags",
  ];

  for (const tableName of requiredTables) {
    if (!(await hasTable(tableName))) {
      console.warn(
        `[knowledge-sync] table not found: ${tableName}. Skip product sync.`,
      );
      return [];
    }
  }

  const [rows] = await pool.execute(`
    SELECT
      p.id,
      p.prod_name AS title,
      p.slug,
      p.price,
      p.created_at AS createdAt,
      pet.tag_ch AS petTag,
      category.tag_ch AS categoryTag,
      GROUP_CONCAT(CASE WHEN intro.intro_type = 'slogan' THEN intro.intro_text END SEPARATOR '\n') AS slogan,
      GROUP_CONCAT(CASE WHEN intro.intro_type = 'content' THEN intro.intro_text END SEPARATOR '\n\n') AS introContent,
      GROUP_CONCAT(CASE WHEN intro.intro_type = 'remark' THEN intro.intro_text END SEPARATOR '\n\n') AS introRemark
    FROM products p
    LEFT JOIN product_intros intro ON intro.prod_id_fk = p.id
    LEFT JOIN product_pet_tags pet ON pet.id = p.pet_tag_id_fk
    LEFT JOIN product_category_tags category ON category.id = p.category_id_fk
    GROUP BY
      p.id,
      p.prod_name,
      p.slug,
      p.price,
      p.created_at,
      pet.tag_ch,
      category.tag_ch
    ORDER BY p.id ASC
  `);

  const baseUrl = getBaseUrl();

  return rows
    .map((row) => {
      const parts = [
        `商品名稱：${row.title}`,
        row.petTag ? `寵物類型：${row.petTag}` : "",
        row.categoryTag ? `商品分類：${row.categoryTag}` : "",
        row.price != null ? `價格：NT$${row.price}` : "",
        row.slogan ? `標語：${normalizeText(row.slogan)}` : "",
        row.introContent ? `說明：${normalizeText(row.introContent)}` : "",
        row.introRemark ? `備註：${normalizeText(row.introRemark)}` : "",
      ].filter(Boolean);

      const content = normalizeText(parts.join("\n\n"));
      if (!content) return null;

      const tags = [row.petTag, row.categoryTag, "商品"]
        .filter(Boolean)
        .map((item) => String(item));

      return {
        doc_key: `PRODUCT:${row.id}`,
        source_type: "PRODUCT",
        source_system: "db",
        source_table: "products",
        source_pk: String(row.id),
        title: String(row.title),
        summary: row.slogan ? normalizeText(row.slogan) : null,
        content,
        source_url: row.slug ? `${baseUrl}/product/${row.slug}` : null,
        locale: "zh-TW",
        tags,
        metadata: {
          petTag: row.petTag || null,
          categoryTag: row.categoryTag || null,
          createdAt: row.createdAt || null,
        },
        priority: 90,
        retrieval_weight: 1.2,
      };
    })
    .filter(Boolean);
}

async function loadPetsFaqDoc() {
  if (!(await hasTable("pets"))) return null;

  const userColumn = (await hasColumn("pets", "user_id_fk"))
    ? "user_id_fk"
    : "user_id";
  const hasSoftDelete = await hasColumn("pets", "is_deleted");
  const activeClause = hasSoftDelete ? "AND p.is_deleted = 0" : "";

  const [summaryRows] = await pool.execute(
    `
      SELECT
        COUNT(*) AS totalPets,
        COUNT(DISTINCT p.${userColumn}) AS totalOwners
      FROM pets p
      WHERE 1 = 1 ${activeClause}
    `,
  );

  let speciesRows = [];
  if (await hasTable("pet_attr_details")) {
    const [rows] = await pool.execute(
      `
        SELECT
          COALESCE(species.attr_option, '未分類') AS species,
          COUNT(*) AS total
        FROM pets p
        LEFT JOIN pet_attr_details species ON species.id = p.species_option_id_fk
        WHERE 1 = 1 ${activeClause}
        GROUP BY species
        ORDER BY total DESC, species ASC
        LIMIT 6
      `,
    );
    speciesRows = rows;
  }

  const summary = summaryRows[0] || { totalPets: 0, totalOwners: 0 };
  const speciesText = formatTopItems(
    speciesRows,
    (row) => `${row.species}：${row.total} 隻`,
  );

  return {
    doc_key: "FAQ:PETS_OVERVIEW",
    source_type: "FAQ",
    source_system: "db",
    source_table: "pets",
    source_pk: "aggregate",
    title: "MOFU 寵物資料與分布概況",
    summary: "會員寵物總數、飼主數與常見寵物類型分布。",
    content: normalizeText(`
      目前系統收錄寵物數：${Number(summary.totalPets || 0)}
      有建立寵物資料的會員數：${Number(summary.totalOwners || 0)}

      常見寵物類型分布：
      ${speciesText}

      說明：資料來自會員填寫之寵物檔案，會隨新增、刪除與編輯即時更新。
    `),
    source_url: `${getBaseUrl()}/member/pets`,
    locale: "zh-TW",
    tags: ["FAQ", "寵物", "會員資料"],
    metadata: {
      totalPets: Number(summary.totalPets || 0),
      totalOwners: Number(summary.totalOwners || 0),
    },
    priority: 70,
    retrieval_weight: 1.05,
  };
}

async function loadFavoritesFaqDoc() {
  if (!(await hasTable("user_favorites"))) return null;

  const [summaryRows] = await pool.execute(
    `
      SELECT
        COUNT(*) AS totalFavorites,
        COUNT(DISTINCT user_id_fk) AS totalUsers,
        COUNT(DISTINCT prod_id_fk) AS totalProducts
      FROM user_favorites
    `,
  );

  const [topRows] = await pool.execute(
    `
      SELECT
        p.prod_name AS productName,
        COUNT(*) AS total
      FROM user_favorites uf
      JOIN products p ON p.id = uf.prod_id_fk
      GROUP BY p.id, p.prod_name
      ORDER BY total DESC, p.id ASC
      LIMIT 8
    `,
  );

  const summary = summaryRows[0] || {
    totalFavorites: 0,
    totalUsers: 0,
    totalProducts: 0,
  };
  const topText = formatTopItems(
    topRows,
    (row) => `${row.productName}（${row.total} 次收藏）`,
  );

  return {
    doc_key: "FAQ:FAVORITES_OVERVIEW",
    source_type: "FAQ",
    source_system: "db",
    source_table: "user_favorites",
    source_pk: "aggregate",
    title: "MOFU 收藏清單概況",
    summary: "收藏總數、使用收藏會員數與熱門收藏商品。",
    content: normalizeText(`
      收藏總筆數：${Number(summary.totalFavorites || 0)}
      使用收藏功能的會員數：${Number(summary.totalUsers || 0)}
      被收藏過的商品數：${Number(summary.totalProducts || 0)}

      熱門收藏商品 Top：
      ${topText}

      說明：收藏資料來自會員手動收藏/取消收藏行為。
    `),
    source_url: `${getBaseUrl()}/member/favorites`,
    locale: "zh-TW",
    tags: ["FAQ", "收藏", "會員行為"],
    metadata: {
      totalFavorites: Number(summary.totalFavorites || 0),
      totalUsers: Number(summary.totalUsers || 0),
      totalProducts: Number(summary.totalProducts || 0),
    },
    priority: 70,
    retrieval_weight: 1.05,
  };
}

async function loadPaymentPolicyDoc() {
  if (!(await hasTable("orders"))) return null;
  if (!(await hasColumn("orders", "payment_method"))) return null;

  const [rows] = await pool.execute(
    `
      SELECT payment_method AS paymentMethod, COUNT(*) AS total
      FROM orders
      WHERE payment_method IS NOT NULL AND payment_method <> ''
      GROUP BY payment_method
      ORDER BY total DESC, payment_method ASC
    `,
  );

  const lines = formatTopItems(rows, (row) => {
    const key = String(row.paymentMethod || "").toLowerCase();
    const label = paymentMethodLabelMap[key] || key || "未命名方式";
    return `${label}（代碼：${key || "n/a"}，使用 ${row.total} 筆）`;
  });

  return {
    doc_key: "POLICY:PAYMENT_METHODS",
    source_type: "POLICY",
    source_system: "db",
    source_table: "orders",
    source_pk: "payment_method:aggregate",
    title: "MOFU 付款方式",
    summary: "依訂單紀錄整理的可辨識付款方式與代碼。",
    content: normalizeText(`
      目前系統可辨識的付款方式如下：
      ${lines}

      說明：此清單依歷史訂單 payment_method 欄位統計，實際可用方式以結帳頁顯示為準。
    `),
    source_url: `${getBaseUrl()}/checkout`,
    locale: "zh-TW",
    tags: ["POLICY", "付款", "訂單"],
    metadata: {
      itemCount: rows.length,
    },
    priority: 80,
    retrieval_weight: 1.15,
  };
}

async function loadShippingPolicyDoc() {
  if (!(await hasTable("order_shipping_infos"))) return null;
  if (!(await hasColumn("order_shipping_infos", "shipping_method")))
    return null;

  const [rows] = await pool.execute(
    `
      SELECT shipping_method AS shippingMethod, COUNT(*) AS total
      FROM order_shipping_infos
      WHERE shipping_method IS NOT NULL AND shipping_method <> ''
      GROUP BY shipping_method
      ORDER BY total DESC, shipping_method ASC
    `,
  );

  const lines = formatTopItems(
    rows,
    (row) => `${row.shippingMethod}（使用 ${row.total} 筆）`,
  );

  return {
    doc_key: "POLICY:SHIPPING_METHODS",
    source_type: "POLICY",
    source_system: "db",
    source_table: "order_shipping_infos",
    source_pk: "shipping_method:aggregate",
    title: "MOFU 配送方式",
    summary: "依訂單收件資訊整理的配送方式。",
    content: normalizeText(`
      目前系統紀錄中的配送方式：
      ${lines}

      說明：此資料依訂單收件資訊統計，實際開放配送方式以結帳頁顯示為準。
    `),
    source_url: `${getBaseUrl()}/checkout`,
    locale: "zh-TW",
    tags: ["POLICY", "配送", "訂單"],
    metadata: {
      itemCount: rows.length,
    },
    priority: 80,
    retrieval_weight: 1.1,
  };
}

async function loadCouponPolicyDoc() {
  if (!(await hasTable("coupons"))) return null;

  const [summaryRows] = await pool.execute(
    `
      SELECT
        COUNT(*) AS totalCoupons,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) AS activeCoupons
      FROM coupons
    `,
  );

  const [topRows] = await pool.execute(
    `
      SELECT
        code,
        title,
        discount_type AS discountType,
        discount_value AS discountValue,
        min_amount AS minAmount
      FROM coupons
      WHERE is_active = 1
      ORDER BY id ASC
      LIMIT 10
    `,
  );

  const summary = summaryRows[0] || { totalCoupons: 0, activeCoupons: 0 };
  const lines = formatTopItems(topRows, (row) => {
    const typeLabel = row.discountType === "percent" ? "折扣%" : "折抵金額";
    return `${row.code} / ${row.title}（${typeLabel}：${row.discountValue}，最低消費：${row.minAmount}）`;
  });

  return {
    doc_key: "POLICY:COUPONS",
    source_type: "POLICY",
    source_system: "db",
    source_table: "coupons",
    source_pk: "aggregate",
    title: "MOFU 優惠券規則概況",
    summary: "優惠券總數、啟用數與目前啟用券內容。",
    content: normalizeText(`
      優惠券總數：${Number(summary.totalCoupons || 0)}
      目前啟用：${Number(summary.activeCoupons || 0)}

      已啟用優惠券清單：
      ${lines}

      說明：優惠券是否可用，仍需同時符合起迄時間、每人使用次數與訂單門檻條件。
    `),
    source_url: `${getBaseUrl()}/member/coupons`,
    locale: "zh-TW",
    tags: ["POLICY", "優惠券", "折扣"],
    metadata: {
      totalCoupons: Number(summary.totalCoupons || 0),
      activeCoupons: Number(summary.activeCoupons || 0),
    },
    priority: 85,
    retrieval_weight: 1.2,
  };
}

async function loadOrderStatusFaqDoc() {
  if (!(await hasTable("orders"))) return null;
  if (!(await hasColumn("orders", "order_status"))) return null;

  const [rows] = await pool.execute(
    `
      SELECT order_status AS orderStatus, COUNT(*) AS total
      FROM orders
      GROUP BY order_status
      ORDER BY order_status ASC
    `,
  );

  const lines = formatTopItems(rows, (row) => {
    const statusNo = Number(row.orderStatus || 0);
    const statusText = orderStatusLabelMap[statusNo] || `狀態 ${statusNo}`;
    return `${statusText}（代碼：${statusNo}，共 ${row.total} 筆）`;
  });

  return {
    doc_key: "FAQ:ORDER_STATUS",
    source_type: "FAQ",
    source_system: "db",
    source_table: "orders",
    source_pk: "order_status:aggregate",
    title: "MOFU 訂單狀態說明",
    summary: "訂單狀態代碼與目前訂單分布。",
    content: normalizeText(`
      訂單狀態代碼與分布：
      ${lines}

      說明：查詢單一訂單時，應同時參考付款狀態(payment_status)與配送狀態(shipping_status)。
    `),
    source_url: `${getBaseUrl()}/member/orders`,
    locale: "zh-TW",
    tags: ["FAQ", "訂單", "狀態"],
    metadata: {
      itemCount: rows.length,
    },
    priority: 75,
    retrieval_weight: 1.1,
  };
}

async function loadNonProductDocs() {
  const docs = await Promise.all([
    loadPetsFaqDoc(),
    loadFavoritesFaqDoc(),
    loadPaymentPolicyDoc(),
    loadShippingPolicyDoc(),
    loadCouponPolicyDoc(),
    loadOrderStatusFaqDoc(),
  ]);

  return docs.filter(Boolean);
}

async function upsertDocs(docs) {
  if (docs.length === 0) return;

  const sql = `
    INSERT INTO ai_knowledge_docs
      (
        doc_key,
        source_type,
        source_system,
        source_table,
        source_pk,
        title,
        summary,
        content,
        content_hash,
        source_url,
        locale,
        tags_json,
        metadata_json,
        priority,
        retrieval_weight,
        freshness_score,
        published_at,
        last_synced_at,
        is_active
      )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), 1)
    ON DUPLICATE KEY UPDATE
      source_type = VALUES(source_type),
      source_system = VALUES(source_system),
      source_table = VALUES(source_table),
      source_pk = VALUES(source_pk),
      title = VALUES(title),
      summary = VALUES(summary),
      content = VALUES(content),
      content_hash = VALUES(content_hash),
      source_url = VALUES(source_url),
      locale = VALUES(locale),
      tags_json = VALUES(tags_json),
      metadata_json = VALUES(metadata_json),
      priority = VALUES(priority),
      retrieval_weight = VALUES(retrieval_weight),
      freshness_score = VALUES(freshness_score),
      published_at = VALUES(published_at),
      last_synced_at = NOW(),
      version_no = CASE
        WHEN content_hash <> VALUES(content_hash) THEN version_no + 1
        ELSE version_no
      END,
      is_active = 1,
      updated_at = CURRENT_TIMESTAMP
  `;

  for (const doc of docs) {
    const contentHash = buildContentHash(doc);
    await pool.execute(sql, [
      doc.doc_key,
      doc.source_type,
      doc.source_system || "db",
      doc.source_table || null,
      doc.source_pk || null,
      doc.title,
      doc.summary || null,
      doc.content,
      contentHash,
      doc.source_url,
      doc.locale || "zh-TW",
      JSON.stringify(doc.tags || []),
      JSON.stringify(doc.metadata || null),
      Number.isFinite(doc.priority) ? doc.priority : 100,
      Number.isFinite(doc.retrieval_weight) ? doc.retrieval_weight : 1.0,
      Number.isFinite(doc.freshness_score) ? doc.freshness_score : 1.0,
      doc.published_at || new Date(),
    ]);
  }
}

async function loadActiveDocsForJson() {
  const [rows] = await pool.execute(`
    SELECT
      id,
      doc_key AS docKey,
      source_type AS sourceType,
      source_system AS sourceSystem,
      source_table AS sourceTable,
      source_pk AS sourcePk,
      title,
      summary,
      content,
      content_hash AS contentHash,
      source_url AS sourceUrl,
      locale,
      tags_json AS tagsJson,
      metadata_json AS metadataJson,
      priority,
      retrieval_weight AS retrievalWeight,
      freshness_score AS freshnessScore,
      version_no AS versionNo,
      updated_at AS updatedAt
    FROM ai_knowledge_docs
    WHERE is_active = 1
    ORDER BY source_type ASC, id ASC
  `);

  return rows.map((row) => {
    let tags = [];
    let metadata = null;
    try {
      const parsed =
        typeof row.tagsJson === "string"
          ? JSON.parse(row.tagsJson)
          : row.tagsJson;
      if (Array.isArray(parsed)) {
        tags = parsed.map((item) => String(item));
      }
    } catch {
      tags = [];
    }

    try {
      metadata =
        typeof row.metadataJson === "string"
          ? JSON.parse(row.metadataJson)
          : row.metadataJson;
    } catch {
      metadata = null;
    }

    return {
      id: Number(row.id),
      docKey: String(row.docKey),
      sourceType: String(row.sourceType),
      sourceSystem: row.sourceSystem ? String(row.sourceSystem) : null,
      sourceTable: row.sourceTable ? String(row.sourceTable) : null,
      sourcePk: row.sourcePk ? String(row.sourcePk) : null,
      title: String(row.title),
      summary: row.summary ? String(row.summary) : null,
      content: String(row.content),
      contentHash: row.contentHash ? String(row.contentHash) : null,
      sourceUrl: row.sourceUrl ? String(row.sourceUrl) : null,
      locale: row.locale ? String(row.locale) : "zh-TW",
      tags,
      metadata,
      priority: Number(row.priority || 100),
      retrievalWeight: Number(row.retrievalWeight || 1),
      freshnessScore: Number(row.freshnessScore || 1),
      versionNo: Number(row.versionNo || 1),
      updatedAt: row.updatedAt,
    };
  });
}

async function writeKnowledgeJson(docs) {
  await fs.mkdir(path.dirname(outputJsonPath), { recursive: true });

  const payload = {
    generatedAt: new Date().toISOString(),
    total: docs.length,
    docs,
  };

  await fs.writeFile(outputJsonPath, JSON.stringify(payload, null, 2), "utf8");
}

async function main() {
  try {
    await ensureKnowledgeTable();

    const productDocs = await loadProductDocs();
    const nonProductDocs = await loadNonProductDocs();
    await upsertDocs(productDocs);
    await upsertDocs(nonProductDocs);

    const allDocs = await loadActiveDocsForJson();
    await writeKnowledgeJson(allDocs);

    console.log(`[knowledge-sync] product docs synced: ${productDocs.length}`);
    console.log(
      `[knowledge-sync] faq/policy docs synced: ${nonProductDocs.length}`,
    );
    console.log(`[knowledge-sync] json docs exported: ${allDocs.length}`);
    console.log(`[knowledge-sync] output: ${outputJsonPath}`);
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error("[knowledge-sync] failed:", error);
  process.exit(1);
});
