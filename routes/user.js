// Functionality: provide profile, security, and account update APIs for logged-in users. Purpose: power member dashboard profile and security tabs.

import bcrypt from "bcrypt";
import { Router } from "express";

import pool from "../utils/connect-mysql.js";
import { formatZhDateTime, requireAuth } from "../utils/auth-session.js";
import { hasTable } from "../utils/schema.js";

const router = Router();

router.use(requireAuth);

router.get("/profile", async (req, res) => {
  const user = req.currentUser;

  return res.json({
    id: String(user.id),
    userNo: user.userNo,
    email: user.email,
    name: user.name,
    nickname: user.nickname,
    phone: user.phone,
    address: user.address,
    avatar: user.avatar,
    emailVerified: Boolean(user.emailVerified),
    googleLinked: Boolean(user.googleId),
    createdAt: user.createdAt,
  });
});

router.patch("/update", async (req, res) => {
  try {
    const user = req.currentUser;
    const { name, nickname, phone, address, avatar } = req.body || {};

    const nextData = {
      name: name === undefined ? undefined : String(name).trim(),
      nickname: nickname === undefined ? undefined : String(nickname).trim(),
      phone: phone === undefined ? undefined : String(phone).trim(),
      address: address === undefined ? undefined : String(address).trim(),
      avatar: avatar === undefined ? undefined : String(avatar).trim(),
    };

    if (nextData.name !== undefined && nextData.name.length === 0) {
      return res.status(400).json({
        error: "INVALID_INPUT",
        details: [{ path: ["name"], message: "姓名不可為空白" }],
      });
    }

    if (nextData.name && nextData.name.length > 50) {
      return res.status(400).json({ error: "INVALID_INPUT" });
    }
    if (nextData.nickname && nextData.nickname.length > 30) {
      return res.status(400).json({ error: "INVALID_INPUT" });
    }
    if (nextData.phone && nextData.phone.length > 30) {
      return res.status(400).json({ error: "INVALID_INPUT" });
    }
    if (nextData.address && nextData.address.length > 255) {
      return res.status(400).json({ error: "INVALID_INPUT" });
    }

    const updates = [];
    const values = [];

    if (nextData.name !== undefined) {
      updates.push("name = ?");
      values.push(nextData.name);
    }
    if (nextData.nickname !== undefined) {
      updates.push("nickname = ?");
      values.push(nextData.nickname || null);
    }
    if (nextData.phone !== undefined) {
      updates.push("phone = ?");
      values.push(nextData.phone || null);
    }
    if (nextData.address !== undefined) {
      updates.push("address = ?");
      values.push(nextData.address || null);
    }
    if (nextData.avatar !== undefined) {
      updates.push("avatar = ?");
      values.push(nextData.avatar || null);
    }

    if (updates.length > 0) {
      updates.push("updated_at = NOW()");
      const updateSql = `UPDATE users SET ${updates.join(", ")} WHERE id = ?`;
      await pool.execute(updateSql, [...values, user.id]);
    }

    const [rows] = await pool.execute(
      "SELECT id, user_no AS userNo, email, name, nickname, phone, address, avatar, email_verified AS emailVerified FROM users WHERE id = ? LIMIT 1",
      [user.id],
    );

    const updated = rows[0];
    return res.json({
      id: String(updated.id),
      userNo: updated.userNo,
      email: updated.email,
      name: updated.name,
      nickname: updated.nickname,
      phone: updated.phone,
      address: updated.address,
      avatar: updated.avatar,
      emailVerified: Boolean(updated.emailVerified),
    });
  } catch (error) {
    console.error("[user/update]", error);
    return res.status(500).json({ error: "INTERNAL_ERROR" });
  }
});

router.get("/security", async (req, res) => {
  try {
    const user = req.currentUser;
    const [rows] = await pool.execute(
      `
        SELECT
          email_verified AS emailVerified,
          email_verified_at AS emailVerifiedAt,
          locked_until AS lockedUntil,
          (
            SELECT provider_user_id
            FROM user_oauth_accounts uoa
            WHERE uoa.user_id = users.id AND uoa.provider = 'GOOGLE'
            LIMIT 1
          ) AS googleId
        FROM users
        WHERE id = ?
        LIMIT 1
      `,
      [user.id],
    );
    const base = rows[0] || {};

    let loginLogs = [];
    if (await hasTable("login_logs")) {
      const [logRows] = await pool.execute(
        `
          SELECT id, created_at AS createdAt, browser, os, device, ip, success
          FROM login_logs
          WHERE user_id = ?
          ORDER BY created_at DESC
          LIMIT 10
        `,
        [user.id],
      );
      loginLogs = logRows.map((row) => ({
        id: String(row.id),
        time: formatZhDateTime(row.createdAt),
        browser: row.browser,
        os: row.os,
        device: row.device,
        ip: row.ip,
        success: Boolean(row.success),
      }));
    }

    return res.json({
      emailVerified: Boolean(base.emailVerified),
      emailVerifiedAt: base.emailVerifiedAt
        ? new Date(base.emailVerifiedAt).toISOString()
        : null,
      googleLinked: Boolean(base.googleId),
      lockedUntil: base.lockedUntil
        ? new Date(base.lockedUntil).toISOString()
        : null,
      loginLogs,
    });
  } catch (error) {
    console.error("[user/security]", error);
    return res.status(500).json({ error: "INTERNAL_ERROR" });
  }
});

router.post("/change-password", async (req, res) => {
  try {
    const user = req.currentUser;
    const { oldPassword, newPassword } = req.body || {};

    if (!oldPassword || !newPassword || String(newPassword).length < 8) {
      return res.status(400).json({ error: "INVALID_INPUT" });
    }

    const [rows] = await pool.execute(
      "SELECT password_hash AS passwordHash FROM users WHERE id = ? LIMIT 1",
      [user.id],
    );
    const full = rows[0];

    if (!full?.passwordHash) {
      return res.status(400).json({
        error: "NO_PASSWORD",
        message: "此帳號使用 Google 登入，無法修改密碼",
      });
    }

    const valid = await bcrypt.compare(oldPassword, full.passwordHash);
    if (!valid) {
      return res
        .status(400)
        .json({ error: "WRONG_PASSWORD", message: "目前密碼不正確" });
    }

    const isSame = await bcrypt.compare(newPassword, full.passwordHash);
    if (isSame) {
      return res
        .status(400)
        .json({ error: "SAME_PASSWORD", message: "新密碼不可與目前密碼相同" });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await pool.execute(
      "UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?",
      [passwordHash, user.id],
    );

    return res.json({ message: "PASSWORD_CHANGED" });
  } catch (error) {
    console.error("[user/change-password]", error);
    return res.status(500).json({ error: "INTERNAL_ERROR" });
  }
});

export default router;
