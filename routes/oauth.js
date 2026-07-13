// Functionality: provide a development-safe Google OAuth entry fallback. Purpose: prevent frontend OAuth button from 404 before real OAuth credentials are configured.

import { Router } from "express";

import pool from "../utils/connect-mysql.js";
import {
  issueAuthTokensAndSession,
  setAuthCookies,
} from "../utils/auth-tokens.js";
import { buildUserNo } from "../utils/user-no.js";

const router = Router();

function buildTempUserNo() {
  return `TMP${Date.now()}`;
}

async function upsertGoogleOauthAccount({
  userId,
  providerUserId,
  email,
  name,
  avatar,
}) {
  const [rows] = await pool.execute(
    "SELECT id FROM user_oauth_accounts WHERE user_id = ? AND provider = 'GOOGLE' LIMIT 1",
    [userId],
  );

  if (rows.length > 0) {
    await pool.execute(
      `
        UPDATE user_oauth_accounts
        SET provider_user_id = ?, provider_email = ?, provider_name = ?, provider_avatar = ?, updated_at = NOW()
        WHERE id = ?
      `,
      [providerUserId, email, name, avatar, rows[0].id],
    );
    return;
  }

  await pool.execute(
    `
      INSERT INTO user_oauth_accounts
      (user_id, provider, provider_user_id, provider_email, provider_name, provider_avatar, created_at, updated_at)
      VALUES (?, 'GOOGLE', ?, ?, ?, ?, NOW(), NOW())
    `,
    [userId, providerUserId, email, name, avatar],
  );
}

router.get("/google", async (req, res) => {
  try {
    if (process.env.NODE_ENV === "production") {
      return res.status(501).json({
        error: "OAUTH_NOT_CONFIGURED",
        message: "Google OAuth 尚未在後端設定。",
      });
    }

    const email = req.query.email
      ? String(req.query.email).trim()
      : "google_demo@petfull.local";
    const providerUserId = req.query.sub
      ? String(req.query.sub).trim()
      : `demo-${email}`;
    const providerName = req.query.name ? String(req.query.name).trim() : null;
    const providerAvatar = req.query.avatar
      ? String(req.query.avatar).trim()
      : null;

    const [rows] = await pool.execute(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [email],
    );

    let userId;
    if (rows.length > 0) {
      userId = rows[0].id;
      await pool.execute(
        "UPDATE users SET email_verified = 1, updated_at = NOW() WHERE id = ?",
        [userId],
      );
    } else {
      const tempUserNo = buildTempUserNo();
      const [result] = await pool.execute(
        "INSERT INTO users (user_no, email, email_verified, created_at, updated_at) VALUES (?, ?, 1, NOW(), NOW())",
        [tempUserNo, email],
      );
      userId = result.insertId;

      const userNo = buildUserNo(new Date(), userId);
      await pool.execute(
        "UPDATE users SET user_no = ?, updated_at = NOW() WHERE id = ?",
        [userNo, userId],
      );
    }

    await upsertGoogleOauthAccount({
      userId,
      providerUserId,
      email,
      name: providerName,
      avatar: providerAvatar,
    });

    const tokenResult = await issueAuthTokensAndSession({ userId, req });
    setAuthCookies(res, tokenResult);

    const redirectTo =
      process.env.FRONTEND_AFTER_LOGIN_URL ||
      "http://localhost:3000/member/dashboard";
    return res.redirect(redirectTo);
  } catch (error) {
    console.error("[oauth/google]", error);
    return res.redirect("http://localhost:3000/auth/login?error=oauth_failed");
  }
});

export default router;
