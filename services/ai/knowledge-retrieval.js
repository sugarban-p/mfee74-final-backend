// Functionality: retrieve top matching AI knowledge documents from database.
// Purpose: provide grounded context for chat AI answers with source references.

import pool from "../../utils/connect-mysql.js";

const DEFAULT_LIMIT = 3;
const DEFAULT_SCAN_LIMIT = 500;

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function extractKeywords(question) {
  const normalized = normalizeText(question);
  if (!normalized) return [];

  const raw = normalized.match(/[\p{Script=Han}]{2,}|[a-z0-9]{2,}/gu) || [];
  const deduped = [];
  const seen = new Set();

  for (const token of raw) {
    const keyword = token.trim();
    if (!keyword) continue;

    const candidates = [keyword];

    // Improve CJK retrieval by adding bigrams/trigrams for longer tokens.
    if (/^[\p{Script=Han}]+$/u.test(keyword) && keyword.length >= 4) {
      for (let i = 0; i < keyword.length - 1; i += 1) {
        candidates.push(keyword.slice(i, i + 2));
      }
      for (let i = 0; i < keyword.length - 2; i += 1) {
        candidates.push(keyword.slice(i, i + 3));
      }
    }

    for (const candidate of candidates) {
      if (!candidate || seen.has(candidate)) continue;
      seen.add(candidate);
      deduped.push(candidate);
      if (deduped.length >= 16) break;
    }

    if (deduped.length >= 16) break;
  }

  return deduped;
}

function scoreDocument(doc, keywords) {
  const title = normalizeText(doc.title);
  const summary = normalizeText(doc.summary);
  const content = normalizeText(doc.content);
  const tags = Array.isArray(doc.tags)
    ? doc.tags.map((t) => normalizeText(t))
    : [];

  let score = 0;
  for (const keyword of keywords) {
    if (!keyword) continue;

    if (title.includes(keyword)) score += 12;
    if (summary.includes(keyword)) score += 8;
    if (tags.some((tag) => tag.includes(keyword))) score += 6;

    if (content.includes(keyword)) {
      score += 2;
      const appearCount = content.split(keyword).length - 1;
      score += Math.min(appearCount, 5);
    }
  }

  if (score <= 0) return 0;

  // Boost by configured retrieval weight and priority.
  score *= Number(doc.retrievalWeight || 1);
  score += Math.max(0, 120 - Number(doc.priority || 100)) * 0.05;

  return Number.isFinite(score) ? score : 0;
}

function parseJsonArray(value) {
  if (!value) return [];
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    return Array.isArray(parsed) ? parsed.map((item) => String(item)) : [];
  } catch {
    return [];
  }
}

export async function retrieveKnowledge(question, options = {}) {
  const limit = Number(options.limit || DEFAULT_LIMIT);
  const scanLimitRaw = Number(options.scanLimit || DEFAULT_SCAN_LIMIT);
  const scanLimit = Number.isFinite(scanLimitRaw)
    ? Math.max(20, Math.min(Math.floor(scanLimitRaw), 2000))
    : DEFAULT_SCAN_LIMIT;

  const keywords = extractKeywords(question);
  if (keywords.length === 0) return [];

  const [rows] = await pool.query(`
    SELECT
      doc_key AS docKey,
      source_type AS sourceType,
      title,
      summary,
      content,
      source_url AS sourceUrl,
      tags_json AS tagsJson,
      priority,
      retrieval_weight AS retrievalWeight,
      updated_at AS updatedAt
    FROM ai_knowledge_docs
    WHERE is_active = 1
    ORDER BY priority ASC, updated_at DESC
    LIMIT ${scanLimit}
  `);

  const scored = rows
    .map((row) => {
      const doc = {
        docKey: String(row.docKey || ""),
        sourceType: String(row.sourceType || ""),
        title: String(row.title || ""),
        summary: row.summary ? String(row.summary) : "",
        content: String(row.content || ""),
        sourceUrl: row.sourceUrl ? String(row.sourceUrl) : null,
        tags: parseJsonArray(row.tagsJson),
        priority: Number(row.priority || 100),
        retrievalWeight: Number(row.retrievalWeight || 1),
        updatedAt: row.updatedAt,
      };

      return {
        ...doc,
        score: scoreDocument(doc, keywords),
      };
    })
    .filter((doc) => doc.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(1, limit));

  return scored;
}

export function buildKnowledgeContext(docs) {
  if (!Array.isArray(docs) || docs.length === 0) return "";

  return docs
    .map((doc, index) => {
      const summary = doc.summary ? `摘要：${doc.summary}\n` : "";
      const sourceLine = doc.sourceUrl
        ? `來源：${doc.sourceUrl}`
        : "來源：內部知識庫";
      return `# 參考資料 ${index + 1}\n標題：${doc.title}\n${summary}內容：${doc.content}\n${sourceLine}`;
    })
    .join("\n\n");
}

export function toKnowledgeSources(docs) {
  if (!Array.isArray(docs)) return [];

  return docs.map((doc) => ({
    docKey: doc.docKey,
    title: doc.title,
    sourceUrl: doc.sourceUrl,
    score: Number(doc.score || 0),
  }));
}
