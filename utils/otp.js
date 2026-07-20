// Functionality: create and verify one-time passwords. Purpose: reuse OTP rules across register verification and forgot-password flows.

import { createHash, randomInt } from "crypto";

import pool from "./connect-mysql.js";

const OTP_TTL_MINS = 10;
const OTP_MAX_TRIES = 3;

function hashCode(code) {
  return createHash("sha256").update(String(code)).digest("hex");
}

export function generateCode() {
  return randomInt(100000, 999999).toString();
}

export async function createOTP(userId, type) {
  await pool.execute(
    "UPDATE otp_codes SET used = 1 WHERE user_id = ? AND type = ? AND used = 0",
    [userId, type],
  );

  const code = generateCode();
  const codeHash = hashCode(code);
  const expiresAt = new Date(Date.now() + OTP_TTL_MINS * 60 * 1000);

  const insertSql = `
    INSERT INTO otp_codes (user_id, code_hash, type, expires_at, used, attempts, send_count, created_at)
    VALUES (?, ?, ?, ?, 0, 0, 1, NOW())
  `;
  const [result] = await pool.execute(insertSql, [
    userId,
    codeHash,
    type,
    expiresAt,
  ]);

  return { id: result.insertId, code };
}

export async function verifyOTP(userId, code, type) {
  const sql = `
    SELECT id, code_hash AS codeHash, attempts, expires_at AS expiresAt
    FROM otp_codes
    WHERE user_id = ? AND type = ? AND used = 0
    ORDER BY created_at DESC
    LIMIT 1
  `;
  const [rows] = await pool.execute(sql, [userId, type]);
  const otp = rows[0];

  if (!otp) return { success: false, reason: "NOT_FOUND" };

  if (new Date(otp.expiresAt).getTime() <= Date.now()) {
    await pool.execute("UPDATE otp_codes SET used = 1 WHERE id = ?", [otp.id]);
    return { success: false, reason: "EXPIRED" };
  }

  if (otp.attempts >= OTP_MAX_TRIES) {
    await pool.execute("UPDATE otp_codes SET used = 1 WHERE id = ?", [otp.id]);
    return { success: false, reason: "MAX_ATTEMPTS" };
  }

  if (otp.codeHash !== hashCode(code)) {
    await pool.execute(
      "UPDATE otp_codes SET attempts = attempts + 1 WHERE id = ?",
      [otp.id],
    );
    return { success: false, reason: "INVALID" };
  }

  await pool.execute("UPDATE otp_codes SET used = 1 WHERE id = ?", [otp.id]);
  return { success: true };
}
