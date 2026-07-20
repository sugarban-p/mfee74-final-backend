// Functionality: provide session-based auth helpers and user-agent parsing. Purpose: share the same login guard behavior across private APIs.

import pool from "./connect-mysql.js";
import {
  findActiveSessionByAccessToken,
  getAccessTokenFromRequest,
  verifyAccessToken,
} from "./auth-tokens.js";

export async function getSessionUser(req) {
  const accessToken = getAccessTokenFromRequest(req);
  if (!accessToken) return null;

  const payload = verifyAccessToken(accessToken);
  if (!payload?.sub) return null;

  const userId = Number(payload.sub);
  if (!Number.isInteger(userId) || userId <= 0) return null;

  const sessionRow = await findActiveSessionByAccessToken({
    token: accessToken,
    userId,
  });
  if (!sessionRow) return null;

  const sql = `
    SELECT
      id,
      user_no AS userNo,
      email,
      name,
      nickname,
      phone,
      address,
      avatar,
      email_verified AS emailVerified,
      (
        SELECT provider_user_id
        FROM user_oauth_accounts uoa
        WHERE uoa.user_id = users.id AND uoa.provider = 'GOOGLE'
        LIMIT 1
      ) AS googleId,
      created_at AS createdAt,
      login_attempts AS loginAttempts,
      locked_until AS lockedUntil
    FROM users
    WHERE id = ?
    LIMIT 1
  `;
  const [rows] = await pool.execute(sql, [userId]);
  return rows[0] || null;
}

export async function requireAuth(req, res, next) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return res.status(401).json({ error: "UNAUTHORIZED" });
    }

    req.currentUser = user;
    return next();
  } catch (error) {
    return res.status(500).json({ error: "INTERNAL_ERROR" });
  }
}

export function parseUserAgent(ua) {
  const userAgent = ua || "";

  const browser = userAgent.includes("Chrome")
    ? "Chrome"
    : userAgent.includes("Firefox")
      ? "Firefox"
      : userAgent.includes("Safari")
        ? "Safari"
        : userAgent.includes("Edge")
          ? "Edge"
          : "Unknown";

  const os =
    userAgent.includes("iPhone") || userAgent.includes("iPad")
      ? "iOS"
      : userAgent.includes("Android")
        ? "Android"
        : userAgent.includes("Mac")
          ? "Mac"
          : userAgent.includes("Windows")
            ? "Windows"
            : "Unknown";

  const device =
    userAgent.includes("Mobile") ||
    userAgent.includes("iPhone") ||
    userAgent.includes("Android")
      ? "mobile"
      : "desktop";

  return { browser, os, device };
}

export function formatZhDateTime(value) {
  if (!value) return null;
  const date = new Date(value);
  return date.toLocaleString("zh-TW");
}
