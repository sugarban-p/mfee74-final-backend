// Functionality: provide FAQ-first support responses with optional AI service layer and safe fallback behavior.

import { askAI } from "../services/ai/index.js";
import pool from "./connect-mysql.js";
import { hasColumn, hasTable, safeCount } from "./schema.js";
import {
  buildKnowledgeContext,
  retrieveKnowledge,
  toKnowledgeSources,
} from "../services/ai/knowledge-retrieval.js";

const FAQ = {
  運費: "全館消費滿 $1,500 元即可享免運費！$1,500 元以下全台統一運費 $60 元。",
  送貨: "全館消費滿 $1,500 元即可享免運費！$1,500 元以下全台統一運費 $60 元。",
  退換: "商品到貨後 7 日內可申請退換貨（限未使用、未開封商品）。",
  退貨: "商品到貨後 7 日內可申請退換貨（限未使用、未開封商品）。",
  付款: "目前付款方式為信用卡付款（Visa / Mastercard / JCB）與 LINE Pay 付款。",
  配送: "訂單確認後 1 到 3 個工作日內出貨，使用黑貓宅急便或新竹物流配送。",
  會員: "會員申請完全免費，註冊後即可享有點數回饋、生日優惠及專屬折扣。",
  優惠券:
    "三組優惠券供您使用：包含新毛友 9 折見面禮（MOFUHI90）、滿千折百（GOOD100）及滿額免運（SHIP60）。",
  折扣碼:
    "三組優惠券供您使用：包含新毛友 9 折見面禮（MOFUHI90）、滿千折百（GOOD100）及滿額免運（SHIP60）。",
  優惠代碼:
    "三組優惠券供您使用：包含新毛友 9 折見面禮（MOFUHI90）、滿千折百（GOOD100）及滿額免運（SHIP60）。",
  MOFUHI90:
    "三組優惠券供您使用：包含新毛友 9 折見面禮（MOFUHI90）、滿千折百（GOOD100）及滿額免運（SHIP60）。",
  GOOD100:
    "三組優惠券供您使用：包含新毛友 9 折見面禮（MOFUHI90）、滿千折百（GOOD100）及滿額免運（SHIP60）。",
  SHIP60:
    "三組優惠券供您使用：包含新毛友 9 折見面禮（MOFUHI90）、滿千折百（GOOD100）及滿額免運（SHIP60）。",
};

const SENSITIVE = [
  "破解",
  "hack",
  "crack",
  "phishing",
  "非法",
  "違法",
  "詐騙",
  "盜帳",
  "竊取",
];

const SENSITIVE_REPLY =
  "非常抱歉，此問題無法為您提供協助。如有其他疑問，歡迎繼續詢問。";
const FALLBACK_REPLY =
  "感謝您的提問，專員將儘快確認內容並回覆您。如有急事也歡迎致電客服專線。";
const PROMOTION_REPLY =
  "三組優惠券供您使用：包含新毛友 9 折見面禮（MOFUHI90）、滿千折百（GOOD100）及滿額免運（SHIP60）。\n目前活動為：滿額 $1500 免運、新品嚐鮮季、滿千折百、會員首購 9 折。";

function normalizeText(value) {
  return String(value || "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .trim();
}

function formatReplyText(value) {
  return normalizeText(value)
    .replace(/\*/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n");
}

function isSensitive(message) {
  const lower = String(message || "").toLowerCase();
  return SENSITIVE.some(
    (keyword) =>
      lower.includes(keyword) || String(message || "").includes(keyword),
  );
}

function matchFAQ(message) {
  for (const [keyword, reply] of Object.entries(FAQ)) {
    if (String(message || "").includes(keyword)) return reply;
  }
  return null;
}

function isDogSuppliesQuery(message) {
  const text = String(message || "");
  if (!text) return false;

  const hasDog =
    text.includes("狗") ||
    text.toLowerCase().includes("dog") ||
    text.includes("狗狗");
  const hasSupplies =
    text.includes("日常用品") ||
    text.includes("生活用品") ||
    text.includes("用品") ||
    text.toLowerCase().includes("supplies");

  return hasDog && hasSupplies;
}

function isPromotionQuery(message) {
  const text = String(message || "").toLowerCase();
  if (!text) return false;

  const keywords = [
    "優惠",
    "活動",
    "折扣",
    "折價",
    "優惠券",
    "折扣碼",
    "優惠代碼",
    "coupon",
    "promo",
    "mofuhi90",
    "good100",
    "ship60",
    "首購",
    "免運",
    "滿千",
    "新品",
  ];

  return keywords.some((keyword) => text.includes(keyword));
}

function parseMemberStatsIntent(message) {
  const text = String(message || "");
  const lower = text.toLowerCase();
  if (!text) return null;

  const hasMineCue =
    text.includes("我的") || text.includes("我") || lower.includes("my");
  const hasCountCue =
    text.includes("幾") ||
    text.includes("多少") ||
    text.includes("數") ||
    text.includes("總") ||
    text.includes("統計");

  const wantsPets =
    (text.includes("寵物") || lower.includes("pet")) &&
    (hasMineCue || hasCountCue);
  const wantsOrders =
    (text.includes("訂單") || lower.includes("order")) &&
    (hasMineCue || hasCountCue);
  const wantsFavorites =
    (text.includes("收藏") ||
      lower.includes("favorite") ||
      lower.includes("favourite")) &&
    (hasMineCue || hasCountCue);

  if (!wantsPets && !wantsOrders && !wantsFavorites) return null;

  return {
    wantsPets,
    wantsOrders,
    wantsFavorites,
  };
}

async function countFavoritesForUser(userId) {
  if (await hasTable("user_favorites")) {
    if (await hasColumn("user_favorites", "user_id_fk")) {
      return safeCount(
        "SELECT COUNT(*) AS total FROM user_favorites WHERE user_id_fk = ?",
        [userId],
        0,
      );
    }

    if (await hasColumn("user_favorites", "user_id")) {
      return safeCount(
        "SELECT COUNT(*) AS total FROM user_favorites WHERE user_id = ?",
        [userId],
        0,
      );
    }

    if (await hasColumn("user_favorites", "member_id_fk")) {
      return safeCount(
        "SELECT COUNT(*) AS total FROM user_favorites WHERE member_id_fk = ?",
        [userId],
        0,
      );
    }
  }

  if (await hasTable("favorites")) {
    if (await hasColumn("favorites", "user_id_fk")) {
      return safeCount(
        "SELECT COUNT(*) AS total FROM favorites WHERE user_id_fk = ?",
        [userId],
        0,
      );
    }

    return safeCount(
      "SELECT COUNT(*) AS total FROM favorites WHERE user_id = ?",
      [userId],
      0,
    );
  }

  return 0;
}

async function countOrdersForUser(userId) {
  if (!(await hasTable("orders"))) return 0;

  const userColumn = (await hasColumn("orders", "user_id_fk"))
    ? "user_id_fk"
    : "user_id";

  return safeCount(
    `SELECT COUNT(*) AS total FROM orders WHERE ${userColumn} = ?`,
    [userId],
    0,
  );
}

async function countPetsForUser(userId) {
  if (!(await hasTable("pets"))) return 0;

  const userColumn = (await hasColumn("pets", "user_id_fk"))
    ? "user_id_fk"
    : "user_id";
  const hasSoftDelete = await hasColumn("pets", "is_deleted");
  const where = hasSoftDelete
    ? `${userColumn} = ? AND is_deleted = 0`
    : `${userColumn} = ?`;

  return safeCount(
    `SELECT COUNT(*) AS total FROM pets WHERE ${where}`,
    [userId],
    0,
  );
}

async function getMemberStatsReplyFromDb(userId, intent) {
  const counts = {
    pets: intent.wantsPets ? await countPetsForUser(userId) : null,
    orders: intent.wantsOrders ? await countOrdersForUser(userId) : null,
    favorites: intent.wantsFavorites
      ? await countFavoritesForUser(userId)
      : null,
  };

  const lines = [];
  if (intent.wantsPets) lines.push(`寵物 ${Number(counts.pets || 0)} 隻`);
  if (intent.wantsOrders) lines.push(`訂單 ${Number(counts.orders || 0)} 筆`);
  if (intent.wantsFavorites)
    lines.push(`收藏 ${Number(counts.favorites || 0)} 項`);

  const singleReplyMap = {
    pets: `你目前有 ${Number(counts.pets || 0)} 隻寵物。`,
    orders: `你目前有 ${Number(counts.orders || 0)} 筆訂單。`,
    favorites: `你目前收藏了 ${Number(counts.favorites || 0)} 項商品。`,
  };

  let reply = "";
  if (intent.wantsPets && !intent.wantsOrders && !intent.wantsFavorites) {
    reply = singleReplyMap.pets;
  } else if (
    !intent.wantsPets &&
    intent.wantsOrders &&
    !intent.wantsFavorites
  ) {
    reply = singleReplyMap.orders;
  } else if (
    !intent.wantsPets &&
    !intent.wantsOrders &&
    intent.wantsFavorites
  ) {
    reply = singleReplyMap.favorites;
  } else {
    reply = `幫你查到目前資料：${lines.join("、")}。`;
  }

  return {
    reply: formatReplyText(reply),
    type: "DB",
    meta: {
      source: "member_stats",
      userId: Number(userId),
      counts,
    },
  };
}

async function getDogSuppliesReplyFromDb() {
  const preferredNames = [
    "玩具總動員系列 罐罐專用湯匙-三入組",
    "MOFU 減壓胸背帶",
    "MOFU 多功能緩衝牽繩",
  ];

  const [rows] = await pool.query(
    `
      SELECT
        p.id,
        p.prod_name AS productName,
        p.price,
        p.slug,
        COALESCE(SUM(i.sold), 0) AS totalSold
      FROM products p
      JOIN product_pet_tags pet ON pet.id = p.pet_tag_id_fk
      JOIN product_category_tags category ON category.id = p.category_id_fk
      LEFT JOIN items i ON i.prod_id_fk = p.id
      WHERE
        (pet.tag_slug = 'dog' OR pet.tag_ch = '狗')
        AND (
          category.tag_slug IN ('supplies', 'leash')
          OR category.tag_ch IN ('生活用品', '牽引用品')
        )
      GROUP BY p.id, p.prod_name, p.price, p.slug
      ORDER BY totalSold DESC, p.id ASC
      LIMIT 20
    `,
  );

  if (!Array.isArray(rows) || rows.length === 0) {
    return {
      reply: formatReplyText(
        "目前資料庫中尚未找到狗狗日常用品商品。若需要我可以幫您改查狗狗主食、零食或保健品。",
      ),
      type: "DB",
      meta: {
        source: "products",
        petType: "dog",
        category: "supplies",
        count: 0,
      },
    };
  }

  const rowByName = new Map(rows.map((row) => [String(row.productName), row]));
  const prioritized = preferredNames
    .map((name) => rowByName.get(name))
    .filter(Boolean);

  const fallback = rows.filter(
    (row) => !preferredNames.includes(String(row.productName)),
  );

  const selectedRows = [...prioritized, ...fallback].slice(0, 3);

  const list = selectedRows
    .map((row, index) => {
      return `${index + 1}. ${row.productName}`;
    })
    .join("\n");

  return {
    reply: formatReplyText(
      `幫你整理幾個狗狗日常會用到的用品，這幾款都不錯：\n${list}`,
    ),
    type: "DB",
    meta: {
      source: "products",
      petType: "dog",
      category: "supplies_or_leash",
      count: selectedRows.length,
      productIds: selectedRows
        .map((row) => Number(row.id))
        .filter((id) => id > 0),
    },
  };
}

function buildAiInput(content, history, knowledgeContext) {
  const normalizedContent = normalizeText(content);
  const lines = [];

  if (knowledgeContext) {
    lines.push("以下是 MOFU 官方知識庫內容，請優先根據這些資料回答：");
    lines.push(knowledgeContext);
    lines.push(
      "若知識庫不足，請明確說明目前查無官方資訊，並建議使用者稍候由真人客服協助。",
    );
    lines.push("----");
  }

  for (const item of history) {
    const text = normalizeText(item.content);
    if (!text) continue;
    lines.push(`${item.sender === "USER" ? "使用者" : "客服"}：${text}`);
  }

  const lastHistory = history[history.length - 1];
  const isDuplicatedLatestUserMessage =
    lastHistory?.sender === "USER" &&
    normalizeText(lastHistory.content) === normalizedContent;

  if (!isDuplicatedLatestUserMessage) {
    lines.push(`使用者：${normalizedContent}`);
  }

  return lines.join("\n");
}

export async function processMessage(content, options = {}) {
  const history = Array.isArray(options.history) ? options.history : [];
  const userId = Number(options.userId || 0);

  if (isSensitive(content)) {
    return { reply: formatReplyText(SENSITIVE_REPLY), type: "BLOCKED" };
  }

  if (isPromotionQuery(content)) {
    return {
      reply: formatReplyText(PROMOTION_REPLY),
      type: "FAQ",
      meta: {
        policy: "PROMOTION_WHITELIST",
      },
    };
  }

  const statsIntent = parseMemberStatsIntent(content);
  if (statsIntent) {
    if (!Number.isInteger(userId) || userId <= 0) {
      return {
        reply: formatReplyText(
          "請先登入會員後，我才能幫你查詢你的寵物、訂單與收藏資料。",
        ),
        type: "FALLBACK",
        meta: {
          reason: "MISSING_USER_CONTEXT",
          source: "member_stats",
        },
      };
    }

    try {
      return await getMemberStatsReplyFromDb(userId, statsIntent);
    } catch (error) {
      console.error("[chat/db/member-stats]", error?.message || error);
      return {
        reply: formatReplyText(
          "目前無法即時讀取你的會員統計資料，請稍後再試。",
        ),
        type: "FALLBACK",
        meta: {
          reason: "DB_QUERY_FAILED",
          source: "member_stats",
        },
      };
    }
  }

  if (isDogSuppliesQuery(content)) {
    try {
      return await getDogSuppliesReplyFromDb();
    } catch (error) {
      console.error("[chat/db/dog-supplies]", error?.message || error);
      return {
        reply: formatReplyText(
          "目前無法即時讀取狗狗日常用品資料，請稍後再試或改由客服協助。",
        ),
        type: "FALLBACK",
        meta: {
          reason: "DB_QUERY_FAILED",
          source: "products",
        },
      };
    }
  }

  const faqReply = matchFAQ(content);
  if (faqReply) return { reply: formatReplyText(faqReply), type: "FAQ" };

  if (process.env.AI_ENABLED !== "true") {
    return {
      reply: formatReplyText(FALLBACK_REPLY),
      type: "FALLBACK",
      meta: {
        provider: String(process.env.AI_PROVIDER || "gemini"),
        model: String(process.env.AI_MODEL || "gemini-3.5-flash"),
        reason: "AI_NOT_CONFIGURED",
      },
    };
  }

  try {
    const startedAt = Date.now();
    const knowledgeDocs = await retrieveKnowledge(content, { limit: 3 });
    const knowledgeContext = buildKnowledgeContext(knowledgeDocs);

    const reply = normalizeText(
      await askAI(buildAiInput(content, history, knowledgeContext)),
    );

    if (!reply) {
      throw new Error("EMPTY_AI_REPLY");
    }

    return {
      reply: formatReplyText(reply),
      type: "AI",
      meta: {
        provider: String(process.env.AI_PROVIDER || "gemini"),
        model: String(process.env.AI_MODEL || "gemini-3.5-flash"),
        latencyMs: Date.now() - startedAt,
        knowledgeSources: toKnowledgeSources(knowledgeDocs),
      },
    };
  } catch (error) {
    console.error(
      "[chat/ai]",
      error?.response?.data || error?.message || error,
    );

    return {
      reply: formatReplyText(FALLBACK_REPLY),
      type: "FALLBACK",
      meta: {
        provider: String(process.env.AI_PROVIDER || "gemini"),
        model: String(process.env.AI_MODEL || "gemini-3.5-flash"),
        reason: "AI_FAILED",
      },
    };
  }
}
