// Functionality: implement OTP send/verify APIs. Purpose: support register email verification and forgot-password validation steps.

import { randomBytes } from "crypto";

import { Router } from "express";

import pool from "../utils/connect-mysql.js";
import {
  sendEmailVerification,
  sendPasswordResetOTP,
} from "../utils/mailer.js";
import { createOTP, verifyOTP } from "../utils/otp.js";

const router = Router();

const ERROR_MESSAGES = {
  NOT_FOUND: "驗證碼不存在或已過期",
  EXPIRED: "驗證碼已過期，請重新發送",
  MAX_ATTEMPTS: "驗證嘗試次數過多，請重新發送驗證碼",
  INVALID: "驗證碼不正確，請再試一次",
};

router.post("/send", async (req, res) => {
  try {
    const { email, type } = req.body || {};
    if (!email || !["EMAIL_VERIFY", "FORGOT_PASSWORD"].includes(type)) {
      return res.status(400).json({ error: "INVALID_INPUT" });
    }

    const [rows] = await pool.execute(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [email],
    );
    const user = rows[0];

    if (!user) {
      return res.json({ message: "OTP_SENT" });
    }

    const { code } = await createOTP(user.id, type);
    if (type === "EMAIL_VERIFY") {
      await sendEmailVerification(email, code);
    } else {
      await sendPasswordResetOTP(email, code);
    }

    return res.json({ message: "OTP_SENT" });
  } catch (error) {
    console.error("[otp/send]", error);
    return res.status(500).json({ error: "INTERNAL_ERROR" });
  }
});

router.post("/verify", async (req, res) => {
  try {
    const { email, code, type } = req.body || {};
    if (
      !email ||
      !code ||
      String(code).length !== 6 ||
      !["EMAIL_VERIFY", "FORGOT_PASSWORD"].includes(type)
    ) {
      return res.status(400).json({ error: "INVALID_INPUT" });
    }

    const [rows] = await pool.execute(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [email],
    );
    const user = rows[0];
    if (!user) {
      return res
        .status(404)
        .json({ error: "NOT_FOUND", message: ERROR_MESSAGES.NOT_FOUND });
    }

    const result = await verifyOTP(user.id, String(code), type);
    if (!result.success) {
      return res.status(400).json({
        error: result.reason,
        message: ERROR_MESSAGES[result.reason] || "驗證失敗",
      });
    }

    if (type === "EMAIL_VERIFY") {
      await pool.execute(
        "UPDATE users SET email_verified = 1, email_verified_at = NOW(), updated_at = NOW() WHERE id = ?",
        [user.id],
      );
      return res.json({ message: "OTP_VERIFIED" });
    }

    const resetToken = randomBytes(32).toString("hex");
    res.cookie("pw_reset_token", resetToken, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 10 * 60 * 1000,
      path: "/",
    });

    return res.json({ message: "OTP_VERIFIED", resetToken });
  } catch (error) {
    console.error("[otp/verify]", error);
    return res.status(500).json({ error: "INTERNAL_ERROR" });
  }
});

export default router;
