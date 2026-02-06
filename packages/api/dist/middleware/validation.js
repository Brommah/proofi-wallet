import { z } from 'zod';
// ── Schemas ──
export const otpSendSchema = z.object({
    email: z.string().email('Invalid email address').max(254),
});
export const otpVerifySchema = z.object({
    email: z.string().email('Invalid email address').max(254),
    code: z.string().min(1, 'Code is required').max(10),
});
export const registerAddressSchema = z.object({
    address: z.string().min(1, 'Address is required').max(256),
});
export const storeMemoSchema = z.object({
    memo: z.string().min(1, 'Memo content is required').max(10_000, 'Memo too long (max 10,000 chars)'),
});
export const storeCredentialSchema = z.object({
    claimType: z.string().min(1, 'Claim type is required').max(100),
    claimData: z.record(z.string(), z.any()).refine((data) => JSON.stringify(data).length <= 50_000, 'Claim data too large (max 50KB)'),
});
export const backupStoreSchema = z.object({
    encryptedSeed: z.string().min(1, 'Encrypted seed is required').max(10_000),
    iv: z.string().min(1, 'IV is required').max(1_000),
    salt: z.string().max(1_000).optional().default(''),
});
export const gameAchievementSchema = z.object({
    game: z.string().min(1, 'Game name is required').max(100),
    score: z.number().optional(),
    achievement: z.string().max(200).optional(),
    data: z.record(z.string(), z.any()).optional(),
});
// ── Middleware factory ──
/**
 * Creates a Hono middleware that validates the request body against a Zod schema.
 * On success, stores the parsed body in context for handlers to use via `c.get('validatedBody')`.
 * On failure, returns a 400 response with structured error details.
 */
export function validate(schema) {
    return async (c, next) => {
        let body;
        try {
            body = await c.req.json();
        }
        catch {
            return c.json({ error: 'Invalid JSON body' }, 400);
        }
        const result = schema.safeParse(body);
        if (!result.success) {
            const errors = result.error.issues.map((issue) => ({
                field: issue.path.join('.'),
                message: issue.message,
            }));
            return c.json({ error: 'Validation failed', details: errors }, 400);
        }
        c.set('validatedBody', result.data);
        await next();
    };
}
//# sourceMappingURL=validation.js.map