import type { Context, Next } from 'hono';
/**
 * Content Security Policy headers for API responses.
 * Restricts what the browser is allowed to load/execute.
 */
export declare function cspMiddleware(): (c: Context, next: Next) => Promise<void>;
//# sourceMappingURL=csp.d.ts.map