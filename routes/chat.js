// Functionality: provide support chat history and messaging APIs. Purpose: back member support history and future chat interaction flows.

import { Router } from "express";

import { requireAuth } from "../utils/auth-session.js";
import { askAI } from "../services/ai/index.js";
import { processMessage } from "../utils/chat.js";
import { newCaseId } from "../utils/chat-cases.js";
import pool from "../utils/connect-mysql.js";
import { emitCaseMessage, emitCaseUpdated } from "../utils/realtime-chat.js";
import { isTableMissingError } from "../utils/schema.js";
import { isSupportUser } from "../utils/support-role.js";

const router = Router();

router.post("/", requireAuth, async (req, res) => {
  try {
    const message = String(req.body?.message || "").trim();
    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Message required",
      });
    }

    const answer = await askAI(message);
    return res.json({
      success: true,
      reply: answer,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "AI 回覆失敗",
    });
  }
});

function requireSupport(req, res, next) {
  if (!isSupportUser(req.currentUser)) {
    return res.status(403).json({ error: "FORBIDDEN" });
  }
  return next();
}

function normalizeMessage(row) {
  return {
    id: String(row.id),
    content: row.content,
    sender: row.sender,
    type: row.type,
    createdAt: new Date(row.created_at ?? row.createdAt).toISOString(),
  };
}

function parseMessageMeta(metadata) {
  if (!metadata) return {};

  try {
    const parsed =
      typeof metadata === "string" ? JSON.parse(metadata) : metadata;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }
    return parsed;
  } catch {
    return {};
  }
}

async function loadRecentHistory(consultationId) {
  const [rows] = await pool.execute(
    `
      SELECT content, sender
      FROM chat_messages
      WHERE consultation_id = ?
      ORDER BY created_at DESC, id DESC
      LIMIT 4
    `,
    [consultationId],
  );

  return rows.reverse().map((item) => ({
    content: String(item.content || ""),
    sender: String(item.sender || ""),
  }));
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

    const history = await loadRecentHistory(consultationId);
    const { reply, type, meta } = await processMessage(content, { history });
    const userMetaParsed = parseMessageMeta(userMeta);
    const aiMeta = JSON.stringify({
      ...userMetaParsed,
      replyType: type,
      aiProvider: meta?.provider || null,
      aiModel: meta?.model || null,
      aiLatencyMs: Number(meta?.latencyMs || 0) || null,
      aiUsage: meta?.usage || null,
      aiFinishReason: meta?.finishReason || null,
      aiReason: meta?.reason || null,
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

    emitCaseMessage({ userId: user.id, caseId, message: userMessage });
    emitCaseMessage({ userId: user.id, caseId, message: botMessage });
    emitCaseUpdated({ userId: user.id, caseId, status: "OPEN" });

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

router.post("/case/close", requireAuth, requireSupport, async (req, res) => {
  try {
    const caseId = String(req.body?.caseId || "").trim();
    if (!caseId) {
      return res.status(400).json({ error: "INVALID_INPUT" });
    }

    const [consultRows] = await pool.execute(
      `
        SELECT id, user_id AS userId, case_no AS caseId, status
        FROM chat_consultations
        WHERE case_no = ?
        LIMIT 1
      `,
      [caseId],
    );

    const consultation = consultRows[0];
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
        req.currentUser.id,
        "客服已將此諮詢標記為已解決，對話已結案。",
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

    const message = normalizeMessage(rows[0]);
    emitCaseMessage({ userId: consultation.userId, caseId, message });
    emitCaseUpdated({ userId: consultation.userId, caseId, status: "CLOSED" });

    return res.json({
      caseId,
      status: "CLOSED",
      message,
    });
  } catch (error) {
    console.error("[chat/case/close]", error);
    return res.status(500).json({ error: "INTERNAL_ERROR" });
  }
});

router.post("/case/handoff", requireAuth, async (req, res) => {
  try {
    const user = req.currentUser;
    const caseId = String(req.body?.caseId || "").trim();
    const reason = String(req.body?.reason || "").trim();

    if (!caseId || !reason) {
      return res.status(400).json({ error: "INVALID_INPUT" });
    }

    const consultation = await findConsultationByCaseNo(user.id, caseId);
    if (!consultation) return res.status(404).json({ error: "CASE_NOT_FOUND" });

    await pool.execute(
      `
        UPDATE chat_consultations
        SET handoff_type = 'EMAIL', handoff_at = NOW(), handoff_reason = ?, updated_at = NOW()
        WHERE id = ?
      `,
      [reason.slice(0, 80), consultation.id],
    );

    emitCaseUpdated({ userId: user.id, caseId, status: consultation.status });

    return res.json({ message: "HANDOFF_REQUESTED", caseId });
  } catch (error) {
    console.error("[chat/case/handoff]", error);
    return res.status(500).json({ error: "INTERNAL_ERROR" });
  }
});

router.get("/support/cases", requireAuth, requireSupport, async (req, res) => {
  try {
    const status = String(req.query.status || "OPEN")
      .trim()
      .toUpperCase();
    const handoff = String(req.query.handoff || "ALL")
      .trim()
      .toUpperCase();

    const where = ["1=1"];
    const params = [];

    if (status === "OPEN" || status === "CLOSED") {
      where.push("c.status = ?");
      params.push(status);
    }

    if (handoff === "EMAIL" || handoff === "NONE") {
      where.push("c.handoff_type = ?");
      params.push(handoff);
    }

    const [rows] = await pool.execute(
      `
        SELECT
          c.case_no AS caseId,
          c.status,
          c.handoff_type AS handoffType,
          c.handoff_at AS handoffAt,
          c.handoff_reason AS handoffReason,
          c.last_message_at AS lastMessageAt,
          c.opened_at AS openedAt,
          c.closed_at AS closedAt,
          u.id AS userId,
          u.email AS userEmail,
          u.name AS userName,
          (
            SELECT m.content
            FROM chat_messages m
            WHERE m.consultation_id = c.id
            ORDER BY m.created_at DESC, m.id DESC
            LIMIT 1
          ) AS preview
        FROM chat_consultations c
        JOIN users u ON u.id = c.user_id
        WHERE ${where.join(" AND ")}
        ORDER BY c.last_message_at DESC, c.id DESC
      `,
      params,
    );

    const cases = rows.map((item) => ({
      caseId: item.caseId,
      status: item.status,
      handoffType: item.handoffType,
      handoffAt: item.handoffAt ? new Date(item.handoffAt).toISOString() : null,
      handoffReason: item.handoffReason,
      lastMessageAt: item.lastMessageAt
        ? new Date(item.lastMessageAt).toISOString()
        : null,
      openedAt: item.openedAt ? new Date(item.openedAt).toISOString() : null,
      closedAt: item.closedAt ? new Date(item.closedAt).toISOString() : null,
      user: {
        id: String(item.userId),
        email: item.userEmail,
        name: item.userName,
      },
      preview: item.preview || "",
    }));

    return res.json({ cases });
  } catch (error) {
    console.error("[chat/support/cases]", error);
    return res.status(500).json({ error: "INTERNAL_ERROR" });
  }
});

router.get(
  "/support/history",
  requireAuth,
  requireSupport,
  async (req, res) => {
    try {
      const caseId = String(req.query.caseId || "").trim();
      if (!caseId) {
        return res.status(400).json({ error: "INVALID_INPUT" });
      }

      const [consultRows] = await pool.execute(
        `
        SELECT id, case_no AS caseId, status
        FROM chat_consultations
        WHERE case_no = ?
        LIMIT 1
      `,
        [caseId],
      );

      const consultation = consultRows[0];
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
        case: { caseId: consultation.caseId, status: consultation.status },
        messages: messages.map(normalizeMessage),
      });
    } catch (error) {
      console.error("[chat/support/history]", error);
      return res.status(500).json({ error: "INTERNAL_ERROR" });
    }
  },
);

router.post("/support/send", requireAuth, requireSupport, async (req, res) => {
  try {
    const supportUser = req.currentUser;
    const caseId = String(req.body?.caseId || "").trim();
    const content = String(req.body?.content || "").trim();

    if (!caseId || !content || content.length > 2000) {
      return res.status(400).json({ error: "INVALID_INPUT" });
    }

    const [consultRows] = await pool.execute(
      `
        SELECT id, user_id AS userId, case_no AS caseId, status
        FROM chat_consultations
        WHERE case_no = ?
        LIMIT 1
      `,
      [caseId],
    );

    const consultation = consultRows[0];
    if (!consultation) return res.status(404).json({ error: "CASE_NOT_FOUND" });

    if (consultation.status === "CLOSED") {
      await pool.execute(
        `
          UPDATE chat_consultations
          SET status = 'OPEN', closed_at = NULL, updated_at = NOW()
          WHERE id = ?
        `,
        [consultation.id],
      );
    }

    const supportMeta = JSON.stringify({
      caseId,
      event: "SUPPORT_REPLY",
      supportUserId: String(supportUser.id),
      supportName: supportUser.name || supportUser.email,
    });

    const [insertResult] = await pool.execute(
      `
        INSERT INTO chat_messages
        (consultation_id, user_id, content, sender, type, metadata, created_at)
        VALUES (?, ?, ?, 'SYSTEM', 'TEXT', ?, NOW())
      `,
      [consultation.id, supportUser.id, content, supportMeta],
    );

    await pool.execute(
      `
        UPDATE chat_consultations
        SET last_message_at = NOW(), updated_at = NOW()
        WHERE id = ?
      `,
      [consultation.id],
    );

    const [rows] = await pool.execute(
      "SELECT id, content, sender, type, created_at FROM chat_messages WHERE id = ? LIMIT 1",
      [insertResult.insertId],
    );
    const message = normalizeMessage(rows[0]);

    emitCaseMessage({ userId: consultation.userId, caseId, message });
    emitCaseUpdated({ userId: consultation.userId, caseId, status: "OPEN" });

    return res.json({
      message,
      caseId,
      caseStatus: "OPEN",
    });
  } catch (error) {
    console.error("[chat/support/send]", error);
    return res.status(500).json({ error: "INTERNAL_ERROR" });
  }
});

export default router;
