import { createTransport, type Transporter } from 'nodemailer';
import { env } from '../config/env.js';

export interface EmailSender {
  sendOtp(email: string, code: string): Promise<void>;
}

// ── Nodemailer implementation ───────────────────────────────────────

export class SmtpEmailSender implements EmailSender {
  private transporter: Transporter;

  constructor() {
    this.transporter = createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
    });
  }

  async sendOtp(email: string, code: string): Promise<void> {
    await this.transporter.sendMail({
      from: env.SMTP_FROM,
      to: email,
      subject: 'Your Proofi verification code',
      text: `Your verification code is: ${code}\n\nThis code expires in ${env.OTP_TTL_SECONDS / 60} minutes.`,
      html: `
        <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto;">
          <h2>Proofi Verification</h2>
          <p>Your verification code is:</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; text-align: center; padding: 20px; background: #f5f5f5; border-radius: 8px;">
            ${code}
          </div>
          <p style="color: #666; font-size: 14px; margin-top: 16px;">
            This code expires in ${env.OTP_TTL_SECONDS / 60} minutes.
          </p>
        </div>
      `,
    });
  }
}

// ── Console sender (development fallback) ───────────────────────────

export class ConsoleEmailSender implements EmailSender {
  async sendOtp(email: string, code: string): Promise<void> {
    console.log(`[OTP] 📧 ${email} → code: ${code}`);
  }
}

/** Create the appropriate email sender based on config */
export function createEmailSender(): EmailSender {
  if (env.SMTP_HOST) {
    console.log('[email] Using SMTP transport');
    return new SmtpEmailSender();
  }
  console.log('[email] No SMTP configured — using console output');
  return new ConsoleEmailSender();
}
