// Functionality: implement authentication APIs for register/login/logout/reset-password. Purpose: provide backend endpoints required by frontend auth pages.

import { randomBytes } from "crypto";

import bcrypt from "bcrypt";
import { Router } from "express";

import pool from "../utils/connect-mysql.js";
import { parseUserAgent } from "../utils/auth-session.js";
import {
  clearAuthCookies,
  findActiveSessionByRefreshToken,
  getAccessTokenFromRequest,
  getRefreshTokenFromRequest,
  issueAuthTokensAndSession,
  revokeSessionByTokens,
  rotateSessionTokens,
  setAuthCookies,
  verifyRefreshToken,
} from "../utils/auth-tokens.js";
import { sendEmailVerification } from "../utils/mailer.js";
import { createOTP } from "../utils/otp.js";
import { hasTable } from "../utils/schema.js";
import { buildUserNo } from "../utils/user-no.js";

const router = Router();
const LOCK_ATTEMPTS = 5;
const LOCK_MS = 30 * 60 * 1000;

function buildTempUserNo() {
  return `TMP${Date.now()}${randomBytes(2).toString("hex")}`;
}

async function insertLoginLog({
  userId = null,
  email = null,
  success,
  reason = null,
  req,
}) {
  const tableReady = await hasTable("login_logs");
  if (!tableReady) return;

  const ip =
    req.headers["x-forwarded-for"] ||
    req.headers["x-real-ip"] ||
    req.ip ||
    "unknown";
  const userAgent = req.headers["user-agent"] || "";
  const parsed = parseUserAgent(userAgent);

  const sql = `
    INSERT INTO login_logs (user_id, email, method, ip, user_agent, browser, os, device, success, reason, created_at)
    VALUES (?, ?, 'PASSWORD', ?, ?, ?, ?, ?, ?, ?, NOW())
  `;
  await pool.execute(sql, [
    userId,
    email,
    ip,
    userAgent,
    parsed.browser,
    parsed.os,
    parsed.device,
    success ? 1 : 0,
    reason,
  ]);
}

router.post("/register", async (req, res) => {
  try {
    const { email, password, name } = req.body || {};

    if (!email || !password || String(password).length < 8) {
      return res.status(400).json({ error: "INVALID_INPUT" });
    }

    const [existsRows] = await pool.execute(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [email],
    );
    if (existsRows.length > 0) {
      return res
        .status(409)
        .json({ error: "EMAIL_EXISTS", message: "此電子郵件已被註冊" });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const displayName = name ? String(name).trim() : null;

    const tempUserNo = buildTempUserNo();

    const insertSql = `
      INSERT INTO users (user_no, email, password_hash, name, nickname, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, NOW(), NOW())
    `;
    const [insertResult] = await pool.execute(insertSql, [
      tempUserNo,
      email,
      passwordHash,
      displayName,
      displayName,
    ]);
    const userId = insertResult.insertId;

    const userNo = buildUserNo(new Date(), userId);
    await pool.execute(
      "UPDATE users SET user_no = ?, updated_at = NOW() WHERE id = ?",
      [userNo, userId],
    );

    const { code } = await createOTP(userId, "EMAIL_VERIFY");
    try {
      await sendEmailVerification(email, code);
    } catch (error) {
      console.error("[register] sendEmailVerification failed:", error.message);
    }

    return res.status(201).json({ message: "REGISTERED", userId });
  } catch (error) {
    console.error("[auth/register]", error);
    return res.status(500).json({ error: "INTERNAL_ERROR" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const rememberMe = Boolean(req.body?.rememberMe);
    if (!email || !password) {
      return res.status(400).json({ error: "INVALID_INPUT" });
    }

    const sql = `
      SELECT
        id,
        email,
        password_hash AS passwordHash,
        name,
        nickname,
        avatar,
        email_verified AS emailVerified,
        (
          SELECT provider_user_id
          FROM user_oauth_accounts uoa
          WHERE uoa.user_id = users.id AND uoa.provider = 'GOOGLE'
          LIMIT 1
        ) AS googleId,
        login_attempts AS loginAttempts,
        locked_until AS lockedUntil
      FROM users
      WHERE email = ?
      LIMIT 1
    `;
    const [rows] = await pool.execute(sql, [email]);
    const user = rows[0];

    if (!user || !user.passwordHash) {
      await insertLoginLog({
        email,
        success: false,
        reason: "INVALID_CREDENTIALS",
        req,
      });
      return res.status(401).json({
        error: "INVALID_CREDENTIALS",
        message: "電子郵件或密碼不正確",
      });
    }

    if (user.lockedUntil && new Date(user.lockedUntil).getTime() > Date.now()) {
      const remainingMs = new Date(user.lockedUntil).getTime() - Date.now();
      const remainingMins = Math.ceil(remainingMs / 60000);
      return res.status(423).json({
        error: "ACCOUNT_LOCKED",
        message: `帳號已暫時鎖定，請於 ${remainingMins} 分鐘後再試`,
        remainingMins,
      });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      const newAttempts = Number(user.loginAttempts || 0) + 1;
      const lockedUntil =
        newAttempts >= LOCK_ATTEMPTS ? new Date(Date.now() + LOCK_MS) : null;
      await pool.execute(
        "UPDATE users SET login_attempts = ?, locked_until = ?, updated_at = NOW() WHERE id = ?",
        [newAttempts, lockedUntil, user.id],
      );
      await insertLoginLog({
        userId: user.id,
        email: user.email,
        success: false,
        reason: "INVALID_CREDENTIALS",
        req,
      });

      const remaining = LOCK_ATTEMPTS - newAttempts;
      return res.status(401).json({
        error: "INVALID_CREDENTIALS",
        message: `電子郵件或密碼不正確${remaining > 0 ? `（還剩 ${remaining} 次機會）` : ""}`,
      });
    }

    if (!Boolean(user.emailVerified)) {
      try {
        const { code } = await createOTP(user.id, "EMAIL_VERIFY");
        await sendEmailVerification(user.email, code);
      } catch (error) {
        console.error(
          "[login] resend email verification failed:",
          error.message,
        );
      }

      await insertLoginLog({
        userId: user.id,
        email: user.email,
        success: false,
        reason: "EMAIL_NOT_VERIFIED",
        req,
      });

      return res.status(403).json({
        error: "EMAIL_NOT_VERIFIED",
        message: "電子郵件尚未驗證，已重新發送驗證碼，請先完成驗證。",
      });
    }

    await pool.execute(
      "UPDATE users SET login_attempts = 0, locked_until = NULL, last_login_at = NOW(), updated_at = NOW() WHERE id = ?",
      [user.id],
    );
    await insertLoginLog({
      userId: user.id,
      email: user.email,
      success: true,
      req,
    });

    const tokenResult = await issueAuthTokensAndSession({
      userId: user.id,
      req,
      rememberMe,
    });
    setAuthCookies(res, tokenResult);

    return res.json({
      message: "LOGIN_SUCCESS",
      accessToken: tokenResult.accessToken,
      refreshToken: tokenResult.refreshToken,
      tokenType: "Bearer",
      expiresIn: tokenResult.accessTokenTtlSec,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        nickname: user.nickname,
        avatar: user.avatar,
        emailVerified: Boolean(user.emailVerified),
      },
    });
  } catch (error) {
    console.error("[auth/login]", error);
    return res.status(500).json({ error: "INTERNAL_ERROR" });
  }
});

router.post("/logout", async (req, res) => {
  try {
    const accessToken = getAccessTokenFromRequest(req);
    const refreshToken = getRefreshTokenFromRequest(req);

    await revokeSessionByTokens({ accessToken, refreshToken });

    clearAuthCookies(res);
    req.session?.destroy(() => {
      res.clearCookie("connect.sid");
      return res.json({ message: "LOGGED_OUT" });
    });
  } catch (error) {
    console.error("[auth/logout]", error);
    return res.status(500).json({ error: "INTERNAL_ERROR" });
  }
});

router.post("/refresh", async (req, res) => {
  const refreshToken = getRefreshTokenFromRequest(req);
  const rememberMe = Boolean(req.body?.rememberMe);
  if (!refreshToken) {
    return res.status(401).json({ error: "UNAUTHORIZED" });
  }

  const payload = verifyRefreshToken(refreshToken);
  if (!payload?.sub) {
    return res.status(401).json({ error: "UNAUTHORIZED" });
  }

  const userId = Number(payload.sub);
  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(401).json({ error: "UNAUTHORIZED" });
  }

  const sessionRow = await findActiveSessionByRefreshToken({
    token: refreshToken,
    userId,
  });

  if (!sessionRow) {
    return res.status(401).json({ error: "UNAUTHORIZED" });
  }

  const tokenResult = await rotateSessionTokens({
    sessionId: sessionRow.id,
    userId,
    req,
    rememberMe,
  });
  setAuthCookies(res, tokenResult);

  return res.json({
    message: "TOKEN_REFRESHED",
    accessToken: tokenResult.accessToken,
    refreshToken: tokenResult.refreshToken,
    tokenType: "Bearer",
    expiresIn: tokenResult.accessTokenTtlSec,
  });
});

router.post("/forgot-password", async (req, res) => {
  try {
    const { email, password, resetToken } = req.body || {};
    if (!email || !password || String(password).length < 8 || !resetToken) {
      return res.status(400).json({ error: "INVALID_INPUT" });
    }

    const cookieToken = req.cookies?.pw_reset_token;
    if (!cookieToken || cookieToken !== resetToken) {
      return res.status(403).json({ error: "INVALID_RESET_TOKEN" });
    }

    const [rows] = await pool.execute(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [email],
    );
    const user = rows[0];
    if (!user) {
      return res.status(404).json({ error: "USER_NOT_FOUND" });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await pool.execute(
      "UPDATE users SET password_hash = ?, login_attempts = 0, locked_until = NULL, updated_at = NOW() WHERE id = ?",
      [passwordHash, user.id],
    );

    if (await hasTable("sessions")) {
      await pool.execute("DELETE FROM sessions WHERE user_id = ?", [user.id]);
    }

    res.clearCookie("pw_reset_token");
    return res.json({ message: "PASSWORD_RESET" });
  } catch (error) {
    console.error("[auth/forgot-password]", error);
    return res.status(500).json({ error: "INTERNAL_ERROR" });
  }
});

router.post("/dev/mock-oauth-google", async (req, res) => {
  try {
    const email =
      req.body?.email || `google_${randomBytes(4).toString("hex")}@mock.local`;
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

      const [oauthRows] = await pool.execute(
        "SELECT id FROM user_oauth_accounts WHERE user_id = ? AND provider = 'GOOGLE' LIMIT 1",
        [userId],
      );

      if (oauthRows.length > 0) {
        await pool.execute(
          "UPDATE user_oauth_accounts SET provider_email = ?, updated_at = NOW() WHERE id = ?",
          [email, oauthRows[0].id],
        );
      } else {
        await pool.execute(
          "INSERT INTO user_oauth_accounts (user_id, provider, provider_user_id, provider_email, created_at, updated_at) VALUES (?, 'GOOGLE', ?, ?, NOW(), NOW())",
          [userId, email, email],
        );
      }
    } else {
      const tempUserNo = buildTempUserNo();
      const [insertResult] = await pool.execute(
        "INSERT INTO users (user_no, email, email_verified, created_at, updated_at) VALUES (?, ?, 1, NOW(), NOW())",
        [tempUserNo, email],
      );
      userId = insertResult.insertId;

      const userNo = buildUserNo(new Date(), userId);
      await pool.execute(
        "UPDATE users SET user_no = ?, updated_at = NOW() WHERE id = ?",
        [userNo, userId],
      );

      await pool.execute(
        "INSERT INTO user_oauth_accounts (user_id, provider, provider_user_id, provider_email, created_at, updated_at) VALUES (?, 'GOOGLE', ?, ?, NOW(), NOW())",
        [userId, email, email],
      );
    }

    const tokenResult = await issueAuthTokensAndSession({ userId, req });
    setAuthCookies(res, tokenResult);

    return res.json({
      message: "LOGIN_SUCCESS",
      accessToken: tokenResult.accessToken,
      refreshToken: tokenResult.refreshToken,
      tokenType: "Bearer",
      expiresIn: tokenResult.accessTokenTtlSec,
      user: { id: userId, email },
    });
  } catch (error) {
    console.error("[auth/dev/mock-oauth-google]", error);
    return res.status(500).json({ error: "INTERNAL_ERROR" });
  }
});

export default router;
