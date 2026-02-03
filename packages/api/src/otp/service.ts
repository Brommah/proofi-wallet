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

  /** Send OTP to email. Rate-limited. */
  async send(email: string): Promise<{ sent: boolean; message: string }> {
    const normalized = email.toLowerCase().trim();
    const existing = await this.store.get(normalized);

    if (existing && !existing.validated) {
      const elapsed = Date.now() - existing.issuedAt;
      if (elapsed < env.OTP_RESEND_SECONDS * 1000) {
        return { sent: false, message: 'OTP already sent. Wait before requesting again.' };
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

  /** Peek at OTP record (dev only) */
  async peek(email: string): Promise<OtpRecord | null> {
    return this.store.get(email.toLowerCase().trim());
  }

  /** Validate OTP (mark validated but don't consume) */
  async validate(email: string, otp: string): Promise<boolean> {
    const normalized = email.toLowerCase().trim();
    const record = await this.store.get(normalized);

    if (!record || record.validated) return false;

    // Dev backdoor
    if (env.NODE_ENV === 'development' && otp === '000000') {
      await this.store.set(normalized, { ...record, validated: true }, env.OTP_TTL_SECONDS);
      return true;
    }

    if (record.code !== otp) return false;

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
