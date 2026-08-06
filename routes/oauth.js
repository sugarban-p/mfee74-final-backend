import { Router } from "express";
import crypto from "crypto";
import axios from "axios";

import pool from "../utils/connect-mysql.js";
import {
  buildClientIp,
  issueAuthTokensAndSession,
  setAuthCookies,
} from "../utils/auth-tokens.js";
import { parseUserAgent } from "../utils/auth-session.js";
import {
  buildGoogleAvatarProxyUrl,
  isGoogleAvatarUrl,
} from "../utils/avatar-url.js";
import { hasTable } from "../utils/schema.js";
import { buildUserNo } from "../utils/user-no.js";

const router = Router();

function getRequestOrigin(req) {
  return `${req.protocol}://${req.get("host")}`;
}

function isAllowedGoogleAvatarSource(url) {
  try {
    const parsed = new URL(String(url || ""));
    return (
      parsed.protocol === "https:" &&
      parsed.hostname.toLowerCase().endsWith("googleusercontent.com")
    );
  } catch {
    return false;
  }
}

router.get("/google/avatar", async (req, res) => {
  try {
    const src = String(req.query.src || "").trim();
    if (!src || !isAllowedGoogleAvatarSource(src)) {
      return res.status(400).json({ error: "INVALID_AVATAR_SOURCE" });
    }

    const response = await axios.get(src, {
      responseType: "arraybuffer",
      timeout: 8000,
      maxRedirects: 3,
    });

    const contentType = String(response.headers["content-type"] || "");
    if (!contentType.toLowerCase().startsWith("image/")) {
      return res.status(400).json({ error: "INVALID_AVATAR_CONTENT" });
    }

    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=3600");
    return res.status(200).send(Buffer.from(response.data));
  } catch (error) {
    console.error("[oauth/google/avatar]", error?.message || error);
    return res.status(502).json({ error: "AVATAR_FETCH_FAILED" });
  }
});

function sanitizeNextPath(value) {
  if (typeof value !== "string") return null;
  if (!value.startsWith("/")) return null;
  if (value.startsWith("//")) return null;
  return value;
}

function getFrontendBaseUrl() {
  const fallback = "http://localhost:3000/member/dashboard";
  const configured = process.env.FRONTEND_AFTER_LOGIN_URL || fallback;

  try {
    const url = new URL(configured);
    return `${url.origin}`;
  } catch {
    return "http://localhost:3000";
  }
}

async function insertGoogleLoginLog({ userId = null, email = null, req }) {
  const tableReady = await hasTable("login_logs");
  if (!tableReady) return;

  const ip = buildClientIp(req).slice(0, 64);
  const userAgent = req.headers["user-agent"] || "";
  const parsed = parseUserAgent(userAgent);

  const sql = `
    INSERT INTO login_logs (user_id, email, method, ip, user_agent, browser, os, device, success, reason, created_at)
    VALUES (?, ?, 'GOOGLE', ?, ?, ?, ?, ?, 1, NULL, NOW())
  `;
  await pool.execute(sql, [
    userId,
    email,
    ip,
    userAgent,
    parsed.browser,
    parsed.os,
    parsed.device,
  ]);
}

// =====================================================
// Google OAuth Login Redirect
// GET /api/oauth/google/login
// =====================================================

router.get("/google/login", (req, res) => {
  const state = crypto.randomBytes(16).toString("hex");
  const nextPath = sanitizeNextPath(req.query.next);

  req.session.googleOAuthState = state;
  req.session.googleOAuthNext = nextPath;

  const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");

  googleAuthUrl.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID);

  googleAuthUrl.searchParams.set(
    "redirect_uri",
    process.env.GOOGLE_CALLBACK_URL,
  );

  googleAuthUrl.searchParams.set("response_type", "code");

  googleAuthUrl.searchParams.set("scope", "openid email profile");

  googleAuthUrl.searchParams.set("state", state);

  res.redirect(googleAuthUrl.toString());
});

// =====================================================
// Google OAuth Callback
// GET /api/oauth/google/callback
// =====================================================

router.get("/google/callback", async (req, res) => {
  try {
    const { code, state } = req.query;
    const frontendBaseUrl = getFrontendBaseUrl();

    if (!state || state !== req.session.googleOAuthState) {
      throw new Error("Invalid OAuth state");
    }

    delete req.session.googleOAuthState;
    const nextPath = sanitizeNextPath(req.session.googleOAuthNext);
    delete req.session.googleOAuthNext;

    if (!code) {
      return res.redirect(
        `${process.env.FRONTEND_AFTER_LOGIN_URL}?error=no_code`,
      );
    }

    // ---------------------------------------------
    // 1. 使用 code 換 Google Token
    // ---------------------------------------------

    const tokenResponse = await axios.post(
      "https://oauth2.googleapis.com/token",
      {
        client_id: process.env.GOOGLE_CLIENT_ID,

        client_secret: process.env.GOOGLE_CLIENT_SECRET,

        code,

        grant_type: "authorization_code",

        redirect_uri: process.env.GOOGLE_CALLBACK_URL,
      },
    );

    const { access_token } = tokenResponse.data;

    // ---------------------------------------------
    // 2. 取得 Google User Profile
    // ---------------------------------------------

    const profileResponse = await axios.get(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      },
    );

    const googleUser = profileResponse.data;

    const { sub, email, name, picture, email_verified } = googleUser;
    const requestOrigin = getRequestOrigin(req);
    const proxyAvatar = isGoogleAvatarUrl(picture)
      ? buildGoogleAvatarProxyUrl(requestOrigin, picture)
      : null;

    if (!email) {
      throw new Error("Google email missing");
    }

    // ---------------------------------------------
    // 3. 建立 / 找尋 users
    // ---------------------------------------------

    const [users] = await pool.execute(
      `
      SELECT id
      FROM users
      WHERE email = ?
      LIMIT 1
      `,
      [email],
    );

    let userId;

    if (users.length > 0) {
      userId = users[0].id;

      await pool.execute(
        `
        UPDATE users
        SET
          email_verified = ?,
          name = CASE
            WHEN (name IS NULL OR name = '') AND ? IS NOT NULL AND ? <> '' THEN ?
            ELSE name
          END,
          avatar = CASE
            WHEN ? IS NOT NULL AND ? <> '' AND (
              avatar IS NULL
              OR avatar = ''
              OR avatar LIKE 'https://lh3.googleusercontent.com/%'
              OR avatar LIKE '%/api/oauth/google/avatar?src=%'
            ) THEN ?
            ELSE avatar
          END,
          updated_at = NOW()
        WHERE id = ?
        `,
        [
          email_verified ? 1 : 0,
          name,
          name,
          name,
          proxyAvatar,
          proxyAvatar,
          proxyAvatar,
          userId,
        ],
      );
    } else {
      const tempUserNo = `TMP${Date.now()}`;

      const [result] = await pool.execute(
        `
        INSERT INTO users
        (
          user_no,
          email,
          name,
          avatar,
          email_verified,
          created_at,
          updated_at
        )
        VALUES
        (
          ?,
          ?,
          ?,
          ?,
          ?,
          NOW(),
          NOW()
        )
        `,
        [tempUserNo, email, name, proxyAvatar, email_verified ? 1 : 0],
      );

      userId = result.insertId;

      const userNo = buildUserNo(new Date(), userId);

      await pool.execute(
        `
        UPDATE users
        SET user_no = ?
        WHERE id = ?
        `,
        [userNo, userId],
      );
    }

    // ---------------------------------------------
    // 4. 建立 / 更新 user_oauth_accounts
    // ---------------------------------------------

    await upsertGoogleOauthAccount({
      userId,

      providerUserId: sub,

      email,

      name,

      avatar: picture,
    });

    // ---------------------------------------------
    // 5. 發自己的 JWT / Session
    // ---------------------------------------------

    const tokenResult = await issueAuthTokensAndSession({
      userId,

      req,
    });

    try {
      await insertGoogleLoginLog({ userId, email, req });
    } catch (error) {
      console.error("[oauth/google] insert login log failed:", error.message);
    }

    setAuthCookies(res, tokenResult);

    // ---------------------------------------------
    // 6. 回前端
    // ---------------------------------------------

    if (nextPath) {
      return res.redirect(`${frontendBaseUrl}${nextPath}`);
    }

    return res.redirect(
      process.env.FRONTEND_AFTER_LOGIN_URL ||
        "http://localhost:3000/member/dashboard",
    );
  } catch (error) {
    console.error("[Google OAuth Callback]", error);

    return res.redirect("http://localhost:3000/auth/login?error=oauth_failed");
  }
});

// =====================================================
// Google OAuth Account Upsert
// =====================================================

async function upsertGoogleOauthAccount({
  userId,

  providerUserId,

  email,

  name,

  avatar,
}) {
  const [rows] = await pool.execute(
    `
    SELECT id
    FROM user_oauth_accounts
    WHERE
      user_id = ?
      AND provider = 'GOOGLE'
    LIMIT 1
    `,
    [userId],
  );

  if (rows.length > 0) {
    await pool.execute(
      `
      UPDATE user_oauth_accounts
      SET

        provider_user_id = ?,

        provider_email = ?,

        provider_name = ?,

        provider_avatar = ?,

        updated_at = NOW()

      WHERE id = ?

      `,
      [providerUserId, email, name, avatar, rows[0].id],
    );

    return;
  }

  await pool.execute(
    `
    INSERT INTO user_oauth_accounts
    (
      user_id,

      provider,

      provider_user_id,

      provider_email,

      provider_name,

      provider_avatar,

      created_at,

      updated_at
    )

    VALUES
    (
      ?,

      'GOOGLE',

      ?,

      ?,

      ?,

      ?,

      NOW(),

      NOW()
    )
    `,
    [userId, providerUserId, email, name, avatar],
  );
}

export default router;
