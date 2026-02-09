import { customAlphabet } from 'nanoid';
import { env } from '../config/env.js';
const generateCode = customAlphabet('0123456789', 6);
export class OtpService {
    store;
    emailSender;
    constructor(store, emailSender) {
        this.store = store;
        this.emailSender = emailSender;
    }
    /** Send OTP to email. Rate-limited. */
    async send(email) {
        const normalized = email.toLowerCase().trim();
        const existing = await this.store.get(normalized);
        if (existing && !existing.validated) {
            const elapsed = Date.now() - existing.issuedAt;
            if (elapsed < env.OTP_RESEND_SECONDS * 1000) {
                return { sent: false, message: 'OTP already sent. Wait before requesting again.' };
            }
        }
        // Use store-computed code (for HmacOtpStore) or generate random (for MemoryOtpStore)
        const storeRecord = await this.store.get(normalized);
        const code = storeRecord?.code || generateCode(env.OTP_LENGTH);
        const record = {
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
    async peek(email) {
        return this.store.get(email.toLowerCase().trim());
    }
    /** Validate OTP (mark validated but don't consume) */
    async validate(email, otp) {
        const normalized = email.toLowerCase().trim();
        const record = await this.store.get(normalized);
        if (!record || record.validated)
            return false;
        // Dev backdoor
        if (env.NODE_ENV === 'development' && otp === '000000') {
            await this.store.set(normalized, { ...record, validated: true }, env.OTP_TTL_SECONDS);
            return true;
        }
        if (record.code !== otp)
            return false;
        await this.store.set(normalized, { ...record, validated: true }, env.OTP_TTL_SECONDS);
        return true;
    }
    /** Validate and consume OTP (for token issuance) */
    async validateAndConsume(email, otp) {
        const valid = await this.validate(email, otp);
        if (valid) {
            await this.store.del(email.toLowerCase().trim());
        }
        return valid;
    }
}
//# sourceMappingURL=service.js.map