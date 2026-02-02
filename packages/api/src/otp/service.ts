import { customAlphabet } from 'nanoid';
import { env } from '../config/env.js';
import type { OtpStore, OtpRecord } from './store.js';
import type { EmailSender } from './email.js';

const generateCode = customAlphabet('0123456789', 6);

export class OtpService {
  constructor(
    private store: OtpStore,
    private emailSender: EmailSender,
  ) {}

  /** Send OTP to email. Returns true if sent, false if rate-limited. */
  async send(email: string): Promise<{ sent: boolean; message: string }> {
    const normalized = email.toLowerCase().trim();
    const existing = await this.store.get(normalized);

    // Rate limit: don't resend if recent OTP exists and hasn't expired
    if (existing && !existing.validated) {
      const elapsed = Date.now() - existing.issuedAt;
      if (elapsed < env.OTP_RESEND_SECONDS * 1000) {
        return { sent: false, message: 'OTP already sent. Please wait before requesting a new one.' };
      }
    }

    const code = generateCode(env.OTP_LENGTH);
    const record: OtpRecord = {
      code,
      email: normalized,
      issuedAt: Date.now(),
      validated: false,
    };

    await this.store.set(normalized, record, env.OTP_TTL_SECONDS);
    await this.emailSender.sendOtp(normalized, code);

    return { sent: true, message: 'OTP sent' };
  }

  /** Validate OTP. Returns true if valid. */
  async validate(email: string, otp: string): Promise<boolean> {
    const normalized = email.toLowerCase().trim();
    const record = await this.store.get(normalized);

    if (!record) return false;
    if (record.validated) return false;

    // Dev backdoor
    if (env.NODE_ENV === 'development' && otp === '000000') {
      await this.store.set(normalized, { ...record, validated: true }, env.OTP_TTL_SECONDS);
      return true;
    }

    if (record.code !== otp) return false;

    // Mark as validated
    await this.store.set(normalized, { ...record, validated: true }, env.OTP_TTL_SECONDS);
    return true;
  }

  /** Validate and consume OTP (for token issuance) */
  async validateAndConsume(email: string, otp: string): Promise<boolean> {
    const valid = await this.validate(email, otp);
    if (valid) {
      await this.store.del(email.toLowerCase().trim());
    }
    return valid;
  }
}
