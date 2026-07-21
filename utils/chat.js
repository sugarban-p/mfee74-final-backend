// Functionality: provide FAQ-first support responses with optional AI service layer and safe fallback behavior.

import { askAI } from "../services/ai/index.js";

const FAQ = {
  運費: "全館消費滿 $1,000 元即可享免運費！$1,000 元以下全台統一運費 $90 元。",
  送貨: "全館消費滿 $1,000 元即可享免運費！$1,000 元以下全台統一運費 $90 元。",
  退換: "商品到貨後 7 日內可申請退換貨（限未使用、未開封商品）。",
  退貨: "商品到貨後 7 日內可申請退換貨（限未使用、未開封商品）。",
  付款: "支援信用卡（VISA / Mastercard / JCB）、LINE Pay、街口支付及超商代碼付款。",
  配送: "訂單確認後 1 到 3 個工作日內出貨，使用黑貓宅急便或新竹物流配送。",
  會員: "會員申請完全免費，註冊後即可享有點數回饋、生日優惠及專屬折扣。",
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

function normalizeText(value) {
  return String(value || "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .trim();
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

function buildAiInput(content, history) {
  const normalizedContent = normalizeText(content);
  const lines = [];
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

  if (isSensitive(content)) return { reply: SENSITIVE_REPLY, type: "BLOCKED" };

  const faqReply = matchFAQ(content);
  if (faqReply) return { reply: faqReply, type: "FAQ" };

  if (process.env.AI_ENABLED !== "true") {
    return {
      reply: FALLBACK_REPLY,
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
    const reply = normalizeText(await askAI(buildAiInput(content, history)));

    if (!reply) {
      throw new Error("EMPTY_AI_REPLY");
    }

    return {
      reply,
      type: "AI",
      meta: {
        provider: String(process.env.AI_PROVIDER || "gemini"),
        model: String(process.env.AI_MODEL || "gemini-3.5-flash"),
        latencyMs: Date.now() - startedAt,
      },
    };
  } catch (error) {
    console.error(
      "[chat/ai]",
      error?.response?.data || error?.message || error,
    );

    return {
      reply: FALLBACK_REPLY,
      type: "FALLBACK",
      meta: {
        provider: String(process.env.AI_PROVIDER || "gemini"),
        model: String(process.env.AI_MODEL || "gemini-3.5-flash"),
        reason: "AI_FAILED",
      },
    };
  }
}
