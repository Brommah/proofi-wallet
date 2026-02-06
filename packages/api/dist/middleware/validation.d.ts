import { z } from 'zod';
import type { Context, Next } from 'hono';
export declare const otpSendSchema: z.ZodObject<{
    email: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
}, {
    email: string;
}>;
export declare const otpVerifySchema: z.ZodObject<{
    email: z.ZodString;
    code: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    code: string;
}, {
    email: string;
    code: string;
}>;
export declare const registerAddressSchema: z.ZodObject<{
    address: z.ZodString;
}, "strip", z.ZodTypeAny, {
    address: string;
}, {
    address: string;
}>;
export declare const storeMemoSchema: z.ZodObject<{
    memo: z.ZodString;
}, "strip", z.ZodTypeAny, {
    memo: string;
}, {
    memo: string;
}>;
export declare const storeCredentialSchema: z.ZodObject<{
    claimType: z.ZodString;
    claimData: z.ZodEffects<z.ZodRecord<z.ZodString, z.ZodAny>, Record<string, any>, Record<string, any>>;
}, "strip", z.ZodTypeAny, {
    claimType: string;
    claimData: Record<string, any>;
}, {
    claimType: string;
    claimData: Record<string, any>;
}>;
export declare const backupStoreSchema: z.ZodObject<{
    encryptedSeed: z.ZodString;
    iv: z.ZodString;
    salt: z.ZodDefault<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    encryptedSeed: string;
    iv: string;
    salt: string;
}, {
    encryptedSeed: string;
    iv: string;
    salt?: string | undefined;
}>;
export declare const gameAchievementSchema: z.ZodObject<{
    game: z.ZodString;
    score: z.ZodOptional<z.ZodNumber>;
    achievement: z.ZodOptional<z.ZodString>;
    data: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    game: string;
    score?: number | undefined;
    achievement?: string | undefined;
    data?: Record<string, any> | undefined;
}, {
    game: string;
    score?: number | undefined;
    achievement?: string | undefined;
    data?: Record<string, any> | undefined;
}>;
/**
 * Creates a Hono middleware that validates the request body against a Zod schema.
 * On success, stores the parsed body in context for handlers to use via `c.get('validatedBody')`.
 * On failure, returns a 400 response with structured error details.
 */
export declare function validate<T extends z.ZodType>(schema: T): (c: Context, next: Next) => Promise<(Response & import("hono").TypedResponse<{
    error: string;
}, 400, "json">) | undefined>;
//# sourceMappingURL=validation.d.ts.map