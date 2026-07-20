// Functionality: issue, verify, rotate, and revoke JWT tokens persisted in sessions table.
// Purpose: provide stateless authentication with server-side session revocation support.

import { createHash, randomBytes } from "crypto";

import jwt from "jsonwebtoken";

import pool from "./connect-mysql.js";

const ACCESS_TOKEN_TTL_SEC = Number(
  process.env.ACCESS_TOKEN_TTL_SEC || 15 * 60,
);
const REFRESH_TOKEN_TTL_SEC = Number(
  process.env.REFRESH_TOKEN_TTL_SEC || 7 * 24 * 60 * 60,
);

const BASE_SECRET = process.env.SESSION_SECRET || "team3-secret-key";
const ACCESS_TOKEN_SECRET =
  process.env.ACCESS_TOKEN_SECRET || `${BASE_SECRET}-access`;
const REFRESH_TOKEN_SECRET =
  process.env.REFRESH_TOKEN_SECRET || `${BASE_SECRET}-refresh`;

function parseUserAgent(ua) {
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

  return { browser, os };
}

function buildDeviceName(ua) {
  const parsed = parseUserAgent(ua);
  return `${parsed.os}/${parsed.browser}`;
}

function buildClientIp(req) {
  const forwarded = String(req.headers["x-forwarded-for"] || "").trim();
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  return String(req.headers["x-real-ip"] || "").trim() || req.ip || "unknown";
}

function signAccessToken(userId) {
  return jwt.sign(
    {
      sub: String(userId),
      typ: "access",
      nonce: randomBytes(8).toString("hex"),
    },
    ACCESS_TOKEN_SECRET,
    {
      expiresIn: ACCESS_TOKEN_TTL_SEC,
    },
  );
}

function signRefreshToken(userId) {
  return jwt.sign(
    {
      sub: String(userId),
      typ: "refresh",
      nonce: randomBytes(8).toString("hex"),
    },
    REFRESH_TOKEN_SECRET,
    {
      expiresIn: REFRESH_TOKEN_TTL_SEC,
    },
  );
}

function buildTokenResult(userId) {
  const accessToken = signAccessToken(userId);
  const refreshToken = signRefreshToken(userId);
  const refreshExpiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_SEC * 1000);

  return {
    accessToken,
    refreshToken,
    accessTokenHash: hashToken(accessToken),
    refreshTokenHash: hashToken(refreshToken),
    accessTokenTtlSec: ACCESS_TOKEN_TTL_SEC,
    refreshExpiresAt,
  };
}

export function hashToken(token) {
  return createHash("sha256").update(String(token)).digest("hex");
}

export function getAccessTokenFromRequest(req) {
  const authHeader = String(req.headers.authorization || "").trim();
  if (authHeader.toLowerCase().startsWith("bearer ")) {
    const token = authHeader.slice(7).trim();
    if (token) return token;
  }

  const cookieToken = String(req.cookies?.access_token || "").trim();
  return cookieToken || null;
}

export function getRefreshTokenFromRequest(req) {
  const bodyToken = String(req.body?.refreshToken || "").trim();
  if (bodyToken) return bodyToken;

  const cookieToken = String(req.cookies?.refresh_token || "").trim();
  return cookieToken || null;
}

export function setAuthCookies(res, tokenResult) {
  const isProduction = process.env.NODE_ENV === "production";

  res.cookie("access_token", tokenResult.accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    maxAge: tokenResult.accessTokenTtlSec * 1000,
  });

  res.cookie("refresh_token", tokenResult.refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    maxAge: REFRESH_TOKEN_TTL_SEC * 1000,
  });
}

export function clearAuthCookies(res) {
  res.clearCookie("access_token");
  res.clearCookie("refresh_token");
}

export function verifyAccessToken(token) {
  try {
    const payload = jwt.verify(token, ACCESS_TOKEN_SECRET);
    if (!payload || payload.typ !== "access") return null;
    return payload;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token) {
  try {
    const payload = jwt.verify(token, REFRESH_TOKEN_SECRET);
    if (!payload || payload.typ !== "refresh") return null;
    return payload;
  } catch {
    return null;
  }
}

export async function issueAuthTokensAndSession({ userId, req }) {
  const tokenResult = buildTokenResult(userId);
  const userAgent = String(req.headers["user-agent"] || "").slice(0, 255);
  const ip = buildClientIp(req).slice(0, 64);
  const deviceName = buildDeviceName(userAgent).slice(0, 100);

  await pool.execute(
    `
      INSERT INTO sessions
      (user_id, access_token_hash, refresh_token_hash, user_agent, ip, device_name, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `,
    [
      userId,
      tokenResult.accessTokenHash,
      tokenResult.refreshTokenHash,
      userAgent || null,
      ip || null,
      deviceName || null,
      tokenResult.refreshExpiresAt,
    ],
  );

  return tokenResult;
}

export async function findActiveSessionByAccessToken({ token, userId }) {
  const [rows] = await pool.execute(
    `
      SELECT id, user_id AS userId
      FROM sessions
      WHERE user_id = ?
        AND access_token_hash = ?
        AND revoked_at IS NULL
        AND expires_at > NOW()
      LIMIT 1
    `,
    [userId, hashToken(token)],
  );

  return rows[0] || null;
}

export async function findActiveSessionByRefreshToken({ token, userId }) {
  const [rows] = await pool.execute(
    `
      SELECT id, user_id AS userId
      FROM sessions
      WHERE user_id = ?
        AND refresh_token_hash = ?
        AND revoked_at IS NULL
        AND expires_at > NOW()
      LIMIT 1
    `,
    [userId, hashToken(token)],
  );

  return rows[0] || null;
}

export async function rotateSessionTokens({ sessionId, userId, req }) {
  const tokenResult = buildTokenResult(userId);
  const userAgent = String(req.headers["user-agent"] || "").slice(0, 255);
  const ip = buildClientIp(req).slice(0, 64);
  const deviceName = buildDeviceName(userAgent).slice(0, 100);

  await pool.execute(
    `
      UPDATE sessions
      SET
        access_token_hash = ?,
        refresh_token_hash = ?,
        user_agent = ?,
        ip = ?,
        device_name = ?,
        expires_at = ?,
        revoked_at = NULL
      WHERE id = ? AND user_id = ?
    `,
    [
      tokenResult.accessTokenHash,
      tokenResult.refreshTokenHash,
      userAgent || null,
      ip || null,
      deviceName || null,
      tokenResult.refreshExpiresAt,
      sessionId,
      userId,
    ],
  );

  return tokenResult;
}

export async function revokeSessionByTokens({ accessToken, refreshToken }) {
  if (!accessToken && !refreshToken) return;

  const where = [];
  const values = [];

  if (accessToken) {
    where.push("access_token_hash = ?");
    values.push(hashToken(accessToken));
  }

  if (refreshToken) {
    where.push("refresh_token_hash = ?");
    values.push(hashToken(refreshToken));
  }

  if (where.length === 0) return;

  await pool.execute(
    `
      UPDATE sessions
      SET revoked_at = NOW()
      WHERE revoked_at IS NULL
        AND (${where.join(" OR ")})
    `,
    values,
  );
}
