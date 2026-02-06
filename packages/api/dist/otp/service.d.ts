import type { OtpStore, OtpRecord } from './store.js';
import type { EmailSender } from './email.js';
export declare class OtpService {
    private store;
    private emailSender;
    constructor(store: OtpStore, emailSender: EmailSender);
    /** Send OTP to email. Rate-limited. */
    send(email: string): Promise<{
        sent: boolean;
        message: string;
    }>;
    /** Peek at OTP record (dev only) */
    peek(email: string): Promise<OtpRecord | null>;
    /** Validate OTP (mark validated but don't consume) */
    validate(email: string, otp: string): Promise<boolean>;
    /** Validate and consume OTP (for token issuance) */
    validateAndConsume(email: string, otp: string): Promise<boolean>;
}
//# sourceMappingURL=service.d.ts.map