// Functionality: provide support chat history and messaging APIs. Purpose: back member support history and future chat interaction flows.

import { Router } from "express";

import { requireAuth } from "../utils/auth-session.js";
import { processMessage } from "../utils/chat.js";
import { newCaseId } from "../utils/chat-cases.js";
import pool from "../utils/connect-mysql.js";
import { isTableMissingError } from "../utils/schema.js";

const router = Router();

function normalizeMessage(row) {
  return {
    id: String(row.id),
    content: row.content,
    sender: row.sender,
    type: row.type,
    createdAt: new Date(row.created_at ?? row.createdAt).toISOString(),
  };
}

async function findConsultationByCaseNo(userId, caseNo) {
  const sql = `
    SELECT id, case_no AS caseNo, status
    FROM chat_consultations
    WHERE user_id = ? AND case_no = ?
    LIMIT 1
  `;
  const [rows] = await pool.execute(sql, [userId, caseNo]);
  return rows[0] || null;
}

router.get("/history", requireAuth, async (req, res) => {
  try {
    const user = req.currentUser;
    const range = req.query.range || "today";
    const caseId = req.query.caseId;

    if (caseId) {
      const consultation = await findConsultationByCaseNo(
        user.id,
        String(caseId),
      );
      if (!consultation) {
        return res.status(404).json({ error: "CASE_NOT_FOUND" });
      }

      const [messages] = await pool.execute(
        `
          SELECT id, content, sender, type, created_at
          FROM chat_messages
          WHERE consultation_id = ?
          ORDER BY created_at ASC, id ASC
        `,
        [consultation.id],
      );

      return res.json({
        case: { caseId: consultation.caseNo, status: consultation.status },
        messages: messages.map(normalizeMessage),
      });
    }

    const where = ["c.user_id = ?"];
    const params = [user.id];

    if (range === "today") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      where.push("c.last_message_at >= ?");
      params.push(today);
    } else if (range === "week") {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      where.push("c.last_message_at >= ?");
      params.push(weekAgo);
    }

    const sql = `
      SELECT
        c.id,
        c.case_no AS caseId,
        c.status,
        c.opened_at AS openedAt,
        c.closed_at AS closedAt,
        c.last_message_at AS lastMessageAt,
        (
          SELECT COUNT(*)
          FROM chat_messages m
          WHERE m.consultation_id = c.id
        ) AS messageCount,
        (
          SELECT m2.content
          FROM chat_messages m2
          WHERE m2.consultation_id = c.id
          ORDER BY m2.created_at DESC, m2.id DESC
          LIMIT 1
        ) AS preview
      FROM chat_consultations c
      WHERE ${where.join(" AND ")}
      ORDER BY c.last_message_at DESC, c.id DESC
    `;
    const [rows] = await pool.execute(sql, params);

    const cases = rows.map((item) => ({
      caseId: item.caseId,
      status: item.status,
      openedAt: item.openedAt ? new Date(item.openedAt).toISOString() : null,
      closedAt: item.closedAt ? new Date(item.closedAt).toISOString() : null,
      lastMessageAt: item.lastMessageAt
        ? new Date(item.lastMessageAt).toISOString()
        : null,
      messageCount: Number(item.messageCount || 0),
      preview: item.preview || "",
    }));

    return res.json({ cases });
  } catch (error) {
    if (isTableMissingError(error)) {
      return res.json({ cases: [] });
    }
    console.error("[chat/history]", error);
    return res.status(500).json({ error: "INTERNAL_ERROR" });
  }
});

router.post("/send", requireAuth, async (req, res) => {
  try {
    const user = req.currentUser;
    const content = String(req.body?.content || "").trim();
    const requestedCaseId = req.body?.caseId
      ? String(req.body.caseId).trim()
      : "";

    if (!content || content.length > 2000) {
      return res.status(400).json({ error: "INVALID_INPUT" });
    }

    let consultationId = null;
    let caseId = requestedCaseId;
    if (caseId) {
      const consultation = await findConsultationByCaseNo(user.id, caseId);
      if (!consultation)
        return res.status(404).json({ error: "CASE_NOT_FOUND" });
      if (consultation.status === "CLOSED") {
        return res.status(409).json({ error: "CASE_CLOSED" });
      }
      consultationId = consultation.id;
    } else {
      caseId = newCaseId();
      const [result] = await pool.execute(
        `
          INSERT INTO chat_consultations
          (case_no, user_id, title, status, handoff_type, opened_at, last_message_at, created_at, updated_at)
          VALUES (?, ?, ?, 'OPEN', 'NONE', NOW(), NOW(), NOW(), NOW())
        `,
        [caseId, user.id, content.slice(0, 40)],
      );
      consultationId = result.insertId;
    }

    const userMeta = JSON.stringify({ caseId, event: "MESSAGE" });
    const [userInsert] = await pool.execute(
      `
        INSERT INTO chat_messages
        (consultation_id, user_id, content, sender, type, metadata, created_at)
        VALUES (?, ?, ?, 'USER', 'TEXT', ?, NOW())
      `,
      [consultationId, user.id, content, userMeta],
    );

    const { reply, type } = await processMessage(content);
    const aiMeta = JSON.stringify({
      caseId,
      event: "MESSAGE",
      replyType: type,
    });
    const [aiInsert] = await pool.execute(
      `
        INSERT INTO chat_messages
        (consultation_id, user_id, content, sender, type, metadata, created_at)
        VALUES (?, ?, ?, ?, 'TEXT', ?, NOW())
      `,
      [
        consultationId,
        user.id,
        reply,
        type === "BLOCKED" ? "SYSTEM" : "AI",
        aiMeta,
      ],
    );

    await pool.execute(
      "UPDATE chat_consultations SET last_message_at = NOW(), updated_at = NOW() WHERE id = ?",
      [consultationId],
    );

    const [createdRows] = await pool.execute(
      "SELECT id, content, sender, type, created_at FROM chat_messages WHERE id IN (?, ?) ORDER BY id ASC",
      [userInsert.insertId, aiInsert.insertId],
    );

    const userMessage = normalizeMessage(createdRows[0]);
    const botMessage = normalizeMessage(createdRows[1]);

    return res.json({
      userMessage,
      botMessage,
      caseId,
      caseStatus: "OPEN",
    });
  } catch (error) {
    console.error("[chat/send]", error);
    return res.status(500).json({ error: "INTERNAL_ERROR" });
  }
});

router.post("/case/close", requireAuth, async (req, res) => {
  try {
    const user = req.currentUser;
    const caseId = String(req.body?.caseId || "").trim();
    if (!caseId) {
      return res.status(400).json({ error: "INVALID_INPUT" });
    }

    const consultation = await findConsultationByCaseNo(user.id, caseId);
    if (!consultation) return res.status(404).json({ error: "CASE_NOT_FOUND" });
    if (consultation.status === "CLOSED") {
      return res.status(409).json({ error: "CASE_ALREADY_CLOSED" });
    }

    const closeMeta = JSON.stringify({ caseId, event: "CASE_CLOSED" });
    const [insertResult] = await pool.execute(
      `
        INSERT INTO chat_messages
        (consultation_id, user_id, content, sender, type, metadata, created_at)
        VALUES (?, ?, ?, 'SYSTEM', 'TEXT', ?, NOW())
      `,
      [
        consultation.id,
        user.id,
        "此諮詢已標記為已解決，對話已結案。",
        closeMeta,
      ],
    );

    await pool.execute(
      "UPDATE chat_consultations SET status = 'CLOSED', closed_at = NOW(), last_message_at = NOW(), updated_at = NOW() WHERE id = ?",
      [consultation.id],
    );

    const [rows] = await pool.execute(
      "SELECT id, content, sender, type, created_at FROM chat_messages WHERE id = ? LIMIT 1",
      [insertResult.insertId],
    );

    return res.json({
      caseId,
      status: "CLOSED",
      message: normalizeMessage(rows[0]),
    });
  } catch (error) {
    console.error("[chat/case/close]", error);
    return res.status(500).json({ error: "INTERNAL_ERROR" });
  }
});

export default router;
