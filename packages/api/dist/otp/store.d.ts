/** OTP request stored in the backend */
export interface OtpRecord {
    code: string;
    email: string;
    issuedAt: number;
    validated: boolean;
}
/** Abstract OTP store — swap implementations for dev/prod */
export interface OtpStore {
    get(email: string): Promise<OtpRecord | null>;
    set(email: string, record: OtpRecord, ttlSeconds: number): Promise<void>;
    del(email: string): Promise<void>;
}
export declare class MemoryOtpStore implements OtpStore {
    private store;
    get(email: string): Promise<OtpRecord | null>;
    set(email: string, record: OtpRecord, ttlSeconds: number): Promise<void>;
    del(email: string): Promise<void>;
}
export declare class HmacOtpStore implements OtpStore {
    private masterSecret;
    private windowMs;
    private consumed;
    constructor(masterSecret: string, windowMs?: number);
    private computeOtp;
    private currentWindow;
    get(email: string): Promise<OtpRecord | null>;
    set(email: string, record: OtpRecord, _ttlSeconds: number): Promise<void>;
    del(email: string): Promise<void>;
}
//# sourceMappingURL=store.d.ts.map