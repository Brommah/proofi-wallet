import { execSync } from 'child_process';
import { writeFileSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { createTransport } from 'nodemailer';
import { env } from '../config/env.js';
function otpHtml(code) {
    return `
<div style="font-family:-apple-system,sans-serif;max-width:420px;margin:0 auto;padding:32px">
  <div style="text-align:center;margin-bottom:24px">
    <div style="display:inline-block;width:48px;height:48px;background:#3B82F6;border-radius:12px;line-height:48px;color:#fff;font-size:24px;font-weight:bold">◇</div>
  </div>
  <h2 style="text-align:center;font-size:20px;margin-bottom:8px;color:#0a0a0a">Proofi Verification</h2>
  <p style="text-align:center;color:#666;font-size:14px;margin-bottom:24px">Enter this code to sign in</p>
  <div style="font-size:36px;font-weight:700;letter-spacing:12px;text-align:center;padding:24px;background:#f5f5f5;border-radius:12px;font-family:'SF Mono',monospace;color:#0a0a0a">
    ${code}
  </div>
  <p style="text-align:center;color:#999;font-size:12px;margin-top:20px">
    Expires in ${env.OTP_TTL_SECONDS / 60} minutes. If you didn't request this, ignore this email.
  </p>
  <div style="text-align:center;margin-top:32px;padding-top:20px;border-top:1px solid #eee">
    <span style="color:#999;font-size:11px">Proofi — Verifiable credentials on Cere Network</span>
  </div>
</div>`;
}
// ── SMTP sender via nodemailer ──────────────────────────────────────
export class SmtpEmailSender {
    transporter;
    from;
    constructor() {
        this.from = env.SMTP_FROM;
        this.transporter = createTransport({
            host: env.SMTP_HOST,
            port: env.SMTP_PORT,
            secure: env.SMTP_PORT === 465,
            auth: {
                user: env.SMTP_USER,
                pass: env.SMTP_PASS,
            },
        });
        console.log(`[email] Using SMTP (${env.SMTP_HOST}:${env.SMTP_PORT}, from: ${this.from})`);
    }
    async sendOtp(email, code) {
        await this.transporter.sendMail({
            from: `"Proofi" <${this.from}>`,
            to: email,
            subject: `Your Proofi code: ${code}`,
            text: `Your Proofi verification code: ${code}\n\nExpires in ${env.OTP_TTL_SECONDS / 60} minutes.\nIf you didn't request this, ignore this email.`,
            html: otpHtml(code),
        });
        console.log(`[OTP] ✅ SMTP email sent to ${email}`);
    }
}
// ── Gmail API sender via gog CLI ────────────────────────────────────
export class GogEmailSender {
    from;
    constructor(from) {
        this.from = from;
        console.log(`[email] Using Gmail API via gog (from: ${from})`);
    }
    async sendOtp(email, code) {
        const subject = `Your Proofi code: ${code}`;
        const textBody = `Your Proofi verification code: ${code}\n\nExpires in ${env.OTP_TTL_SECONDS / 60} minutes.\nIf you didn't request this, ignore this email.`;
        const tmpFile = join(tmpdir(), `proofi-otp-${Date.now()}.txt`);
        try {
            writeFileSync(tmpFile, textBody);
            const cmd = [
                'gog', 'gmail', 'send',
                '--to', email,
                '--subject', `"${subject}"`,
                '--body-file', tmpFile,
                '--no-input',
            ];
            execSync(cmd.join(' '), { timeout: 15000, stdio: 'pipe' });
            console.log(`[OTP] ✅ Email sent to ${email}`);
        }
        catch (err) {
            console.error(`[OTP] ❌ gog send failed: ${err.stderr?.toString() || err.message}`);
            throw new Error('Failed to send verification email');
        }
        finally {
            try {
                unlinkSync(tmpFile);
            }
            catch { /* ignore */ }
        }
    }
}
// ── Console sender (development fallback) ───────────────────────────
export class ConsoleEmailSender {
    async sendOtp(email, code) {
        console.log(`[OTP] 📧 ${email} → code: ${code}`);
    }
}
/** Factory — picks sender based on config */
export function createEmailSender() {
    // Priority 1: SMTP config
    if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
        return new SmtpEmailSender();
    }
    // Priority 2: gog CLI (local dev)
    try {
        execSync('which gog', { stdio: 'pipe' });
        const from = env.SMTP_FROM || 'martijn.broersma@gmail.com';
        return new GogEmailSender(from);
    }
    catch {
        // gog not available
    }
    console.log('[email] No email transport available — using console output');
    return new ConsoleEmailSender();
}
//# sourceMappingURL=email.js.map