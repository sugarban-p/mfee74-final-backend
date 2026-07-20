// Functionality: send OTP-related emails through SMTP. Purpose: centralize outgoing mail settings and templates for auth flows.

import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM =
  process.env.SMTP_FROM ||
  `MOFU <${process.env.SMTP_USER || "noreply@mofu.com"}>`;

function card(content) {
  return `<!DOCTYPE html><html><body style="margin:0;background:#FFFDF9;font-family:sans-serif">
  <div style="max-width:480px;margin:32px auto;background:#fff;border-radius:16px;border:1px solid rgba(200,160,120,.22);overflow:hidden">
    <div style="background:linear-gradient(135deg,#E8793A,#F97316);padding:28px;text-align:center">
      <span style="font-size:36px">🐾</span>
      <h1 style="margin:8px 0 0;color:#fff;font-size:22px;font-weight:700">MOFU</h1>
    </div>
    <div style="padding:32px">${content}</div>
    <div style="padding:16px 32px;background:#F5F1EC;text-align:center">
      <p style="margin:0;color:#9C8E82;font-size:12px">© 2026 MOFU. All rights reserved.</p>
    </div>
  </div></body></html>`;
}

function otpBlock(otp) {
  return `<div style="background:#FFF3E8;border-radius:12px;padding:24px;text-align:center;margin:24px 0">
    <span style="font-size:40px;font-weight:700;color:#E8793A;letter-spacing:10px">${otp}</span>
    <p style="margin:8px 0 0;color:#9C8E82;font-size:12px">此驗證碼將於 10 分鐘後失效</p>
  </div>`;
}

export async function sendEmailVerification(to, otp) {
  const html = card(`
    <h2 style="color:#2D2826;margin:0 0 8px">電子郵件驗證</h2>
    <p style="color:#9C8E82;margin:0 0 4px">請使用以下驗證碼完成帳號驗證。</p>
    ${otpBlock(otp)}
    <p style="color:#9C8E82;font-size:13px;margin:0">如非本人操作，請忽略此封郵件。</p>`);
  await transporter.sendMail({
    from: FROM,
    to,
    subject: "【MOFU】電子郵件驗證碼",
    html,
  });
}

export async function sendPasswordResetOTP(to, otp) {
  const html = card(`
    <h2 style="color:#2D2826;margin:0 0 8px">密碼重設驗證碼</h2>
    <p style="color:#9C8E82;margin:0 0 4px">您已申請重設密碼，請使用以下驗證碼。</p>
    ${otpBlock(otp)}
    <p style="color:#9C8E82;font-size:13px;margin:0">如非本人操作，請立即更改您的帳號密碼。</p>`);
  await transporter.sendMail({
    from: FROM,
    to,
    subject: "【MOFU】密碼重設驗證碼",
    html,
  });
}
