// ── In-memory implementation (acceptable for single-instance API) ───
// State is lost on restart, but OTPs are short-lived anyway (5 min).
// This is NOT a database — it's ephemeral rate-limiting state.
export class MemoryOtpStore {
    store = new Map();
    async get(email) {
        const entry = this.store.get(email);
        if (!entry)
            return null;
        if (Date.now() > entry.expiresAt) {
            this.store.delete(email);
            return null;
        }
        return entry.record;
    }
    async set(email, record, ttlSeconds) {
        this.store.set(email, { record, expiresAt: Date.now() + ttlSeconds * 1000 });
    }
    async del(email) {
        this.store.delete(email);
    }
}
// ── HMAC-based stateless OTP store ──────────────────────────────────
// Uses HMAC(MASTER_SECRET, email + timestamp_window + nonce) to verify OTPs
// without storing them. The OTP is deterministic for a given time window.
// This is fully stateless — no storage needed at all!
//
// How it works:
// 1. On send: compute HMAC(secret, email + window) → truncate to 6 digits → send to user
// 2. On verify: recompute the same HMAC for current + recent windows → compare
// The "window" is floor(timestamp / windowSize), so all requests within that window
// produce the same OTP.
export class HmacOtpStore {
    masterSecret;
    windowMs;
    // Track consumed OTPs in memory to prevent replay (small, ephemeral)
    consumed = new Map();
    constructor(masterSecret, windowMs = 300_000 /* 5 minutes */) {
        this.masterSecret = masterSecret;
        this.windowMs = windowMs;
        // Periodic cleanup of consumed OTPs (every 5 min)
        const cleanup = setInterval(() => {
            const now = Date.now();
            for (const [key, expiry] of this.consumed) {
                if (now > expiry)
                    this.consumed.delete(key);
            }
        }, 300_000);
        if (cleanup.unref)
            cleanup.unref();
    }
    async computeOtp(email, window) {
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey('raw', encoder.encode(this.masterSecret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
        const data = encoder.encode(`${email.toLowerCase().trim()}:${window}:proofi-otp-v1`);
        const sig = await crypto.subtle.sign('HMAC', key, data);
        const bytes = new Uint8Array(sig);
        // Truncate to 6 digits using HOTP-style dynamic truncation
        const offset = bytes[bytes.length - 1] & 0x0f;
        const code = ((bytes[offset] & 0x7f) << 24) |
            ((bytes[offset + 1] & 0xff) << 16) |
            ((bytes[offset + 2] & 0xff) << 8) |
            (bytes[offset + 3] & 0xff);
        return String(code % 1_000_000).padStart(6, '0');
    }
    currentWindow() {
        return Math.floor(Date.now() / this.windowMs);
    }
    async get(email) {
        const normalized = email.toLowerCase().trim();
        const window = this.currentWindow();
        const code = await this.computeOtp(normalized, window);
        const isConsumed = this.consumed.has(`${normalized}:${window}`);
        return {
            code,
            email: normalized,
            issuedAt: window * this.windowMs,
            validated: isConsumed,
        };
    }
    async set(email, record, _ttlSeconds) {
        // No-op for HMAC store — the OTP is computed on the fly
        // But we track "validated" state to prevent replay
        if (record.validated) {
            const normalized = email.toLowerCase().trim();
            const window = this.currentWindow();
            this.consumed.set(`${normalized}:${window}`, Date.now() + this.windowMs);
        }
    }
    async del(email) {
        const normalized = email.toLowerCase().trim();
        const window = this.currentWindow();
        this.consumed.set(`${normalized}:${window}`, Date.now() + this.windowMs);
    }
}
//# sourceMappingURL=store.js.map