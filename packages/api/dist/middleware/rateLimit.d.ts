import type { Context, Next } from 'hono';
/**
 * Global rate limit: 100 requests per minute per IP.
 * Applied to all routes.
 */
export declare function globalRateLimit(): (c: Context, next: Next) => Promise<(Response & import("hono").TypedResponse<{
    error: string;
    retryAfter: number;
}, 429, "json">) | undefined>;
/**
 * OTP rate limit: 5 sends per minute per IP.
 * Applied to POST /auth/otp/send.
 */
export declare function otpRateLimit(): (c: Context, next: Next) => Promise<(Response & import("hono").TypedResponse<{
    error: string;
    retryAfter: number;
}, 429, "json">) | undefined>;
/**
 * DDC rate limit: 20 operations per minute per IP.
 * Applied to DDC write endpoints.
 */
export declare function ddcRateLimit(): (c: Context, next: Next) => Promise<(Response & import("hono").TypedResponse<{
    error: string;
    retryAfter: number;
}, 429, "json">) | undefined>;
//# sourceMappingURL=rateLimit.d.ts.map