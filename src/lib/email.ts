// Email sending via Nodemailer + Gmail SMTP.
// Falls back to logging when SMTP is not configured (local development).

import nodemailer from "nodemailer";
import { APP_NAME, APP_URL } from "@/lib/constants";

function getTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_USER || !SMTP_PASS) return null;
  return nodemailer.createTransport({
    host: SMTP_HOST || "smtp.gmail.com",
    port: Number(SMTP_PORT || 587),
    secure: false,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(options: EmailOptions): Promise<{ ok: boolean; info?: string }> {
  const transporter = getTransporter();
  if (!transporter) {
    console.log(`[EMAIL] (SMTP not configured) To: ${options.to} | Subject: ${options.subject}`);
    return { ok: true, info: "logged" };
  }
  try {
    const info = await transporter.sendMail({
      from: `"${APP_NAME}" <${process.env.SMTP_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
    return { ok: true, info: info.messageId };
  } catch (error) {
    console.error("[EMAIL] Failed to send:", error);
    return { ok: false, info: String(error) };
  }
}

export function emailTemplate(body: string): string {
  return `
  <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #f8fafc; border-radius: 12px; overflow: hidden;">
    <div style="background: #059669; padding: 28px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px;">🌳 ${APP_NAME}</h1>
      <p style="color: #d1fae5; margin: 6px 0 0; font-size: 13px;">Pakistan ka pehla complete family platform</p>
    </div>
    <div style="padding: 32px; background: #ffffff;">
      ${body}
    </div>
    <div style="padding: 20px; text-align: center; background: #f1f5f9; font-size: 12px; color: #64748b;">
      © ${new Date().getFullYear()} ${APP_NAME} · <a href="${APP_URL}" style="color: #059669;">${APP_URL}</a>
    </div>
  </div>`;
}

export async function sendWelcomeEmail(to: string, name: string) {
  return sendEmail({
    to,
    subject: `${APP_NAME} mein khush aamdeed! 🌳`,
    html: emailTemplate(`
      <h2 style="color: #0f172a;">Assalam-o-Alaikum, ${name}!</h2>
      <p style="color: #334155; line-height: 1.7;">
        ${APP_NAME} par account banane ka shukriya. Ab aap apne khandaan ko digital bana sakte hain:
      </p>
      <ul style="color: #334155; line-height: 2;">
        <li>📅 Family events banayein aur manage karein</li>
        <li>👥 Apni community aur clan se judein</li>
        <li>💚 Rishta profiles dekhein</li>
        <li>💼 Jobs dhoondein ya post karein</li>
        <li>📸 Memories aur tasveerein mehfooz karein</li>
      </ul>
      <a href="${APP_URL}/dashboard" style="display: inline-block; background: #059669; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 12px;">Dashboard Kholen</a>
    `),
  });
}

export async function sendResetPasswordEmail(to: string, token: string) {
  return sendEmail({
    to,
    subject: `${APP_NAME} — Password Reset`,
    html: emailTemplate(`
      <h2 style="color: #0f172a;">Password reset ki request</h2>
      <p style="color: #334155; line-height: 1.7;">
        Aapne password reset karne ki request ki hai. Neeche button par click karein:
      </p>
      <a href="${APP_URL}/reset-password?token=${token}" style="display: inline-block; background: #059669; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 16px 0;">Password Reset Karein</a>
      <p style="color: #64748b; font-size: 13px;">
        Agar aapne yeh request nahi ki thi to is email ko ignore kar dein. Yeh link 1 ghante mein expire ho jayega.
      </p>
    `),
  });
}

export async function sendEventReminderEmail(to: string, eventTitle: string, eventDate: string, eventUrl: string) {
  return sendEmail({
    to,
    subject: `${APP_NAME} — Event Reminder: ${eventTitle}`,
    html: emailTemplate(`
      <h2 style="color: #0f172a;">📅 Kal event hai!</h2>
      <p style="color: #334155; line-height: 1.7;">
        <strong>${eventTitle}</strong><br/>
        Date: ${eventDate}
      </p>
      <a href="${eventUrl}" style="display: inline-block; background: #059669; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">Event Dekhein</a>
    `),
  });
}
