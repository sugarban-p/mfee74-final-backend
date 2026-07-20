// Functionality: provide authenticated realtime chat broadcasting for members and support agents.
// Purpose: centralize websocket setup, presence tracking, and event emission logic.

import { Server } from "socket.io";

import {
  findActiveSessionByAccessToken,
  verifyAccessToken,
} from "./auth-tokens.js";
import pool from "./connect-mysql.js";
import { isSupportUser } from "./support-role.js";

let ioInstance = null;

function parseAccessTokenFromCookie(cookieHeader) {
  const source = String(cookieHeader || "");
  if (!source) return null;

  const pairs = source.split(";");
  for (const pair of pairs) {
    const [rawKey, ...rest] = pair.split("=");
    const key = String(rawKey || "").trim();
    if (key !== "access_token") continue;
    const value = rest.join("=").trim();
    if (value) return decodeURIComponent(value);
  }

  return null;
}

function getAccessTokenFromSocket(socket) {
  const authToken = String(socket.handshake.auth?.accessToken || "").trim();
  if (authToken) return authToken;

  const authHeader = String(
    socket.handshake.headers?.authorization || "",
  ).trim();
  if (authHeader.toLowerCase().startsWith("bearer ")) {
    const bearerToken = authHeader.slice(7).trim();
    if (bearerToken) return bearerToken;
  }

  return parseAccessTokenFromCookie(socket.handshake.headers?.cookie);
}

async function getSocketUser(accessToken) {
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

  const [rows] = await pool.execute(
    "SELECT id, email, name FROM users WHERE id = ? LIMIT 1",
    [userId],
  );

  return rows[0] || null;
}

async function markSocketOnline({ userId, socketId }) {
  await pool.execute(
    `
      INSERT INTO socket_connections
      (user_id, socket_id, is_online, connected_at, created_at)
      VALUES (?, ?, 1, NOW(), NOW())
    `,
    [userId, socketId],
  );
}

async function markSocketOffline(socketId) {
  await pool.execute(
    `
      UPDATE socket_connections
      SET is_online = 0, disconnected_at = NOW()
      WHERE socket_id = ?
    `,
    [socketId],
  );
}

function emitPresence(user) {
  if (!ioInstance) return;
  ioInstance.to("support").emit("chat:presence", {
    userId: String(user.id),
    isOnline: true,
  });
}

function emitPresenceOffline(user) {
  if (!ioInstance) return;
  ioInstance.to("support").emit("chat:presence", {
    userId: String(user.id),
    isOnline: false,
  });
}

export function initRealtimeChat(server) {
  if (ioInstance) return ioInstance;

  ioInstance = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || "http://localhost:3000",
      credentials: true,
    },
  });

  ioInstance.use(async (socket, next) => {
    try {
      const accessToken = getAccessTokenFromSocket(socket);
      const user = await getSocketUser(accessToken);
      if (!user) return next(new Error("UNAUTHORIZED"));

      socket.currentUser = user;
      return next();
    } catch (error) {
      return next(new Error("UNAUTHORIZED"));
    }
  });

  ioInstance.on("connection", async (socket) => {
    const user = socket.currentUser;
    const userRoom = `user:${user.id}`;
    socket.join(userRoom);

    if (isSupportUser(user)) {
      socket.join("support");
    }

    try {
      await markSocketOnline({ userId: user.id, socketId: socket.id });
      emitPresence(user);
    } catch (error) {
      console.error("[socket/connect]", error);
    }

    socket.on("chat:join-case", async (payload = {}) => {
      const caseId = String(payload.caseId || "").trim();
      if (!caseId) return;

      socket.join(`case:${caseId}`);
    });

    socket.on("disconnect", async () => {
      try {
        await markSocketOffline(socket.id);
        emitPresenceOffline(user);
      } catch (error) {
        console.error("[socket/disconnect]", error);
      }
    });
  });

  return ioInstance;
}

export function emitCaseMessage({ userId, caseId, message }) {
  if (!ioInstance) return;

  const payload = {
    caseId,
    message,
  };

  ioInstance.to(`user:${userId}`).emit("chat:message", payload);
  ioInstance.to("support").emit("chat:message", payload);
  ioInstance.to(`case:${caseId}`).emit("chat:message", payload);
}

export function emitCaseUpdated({ userId, caseId, status }) {
  if (!ioInstance) return;

  const payload = {
    caseId,
    status,
  };

  ioInstance.to(`user:${userId}`).emit("chat:case-updated", payload);
  ioInstance.to("support").emit("chat:case-updated", payload);
  ioInstance.to(`case:${caseId}`).emit("chat:case-updated", payload);
}
