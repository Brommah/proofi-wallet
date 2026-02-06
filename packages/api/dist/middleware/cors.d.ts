/**
 * CORS middleware with production-safe whitelist.
 *
 * Allowed origins:
 * - https://proofi-virid.vercel.app (production UI)
 * - https://proofi.ai (custom domain)
 * - http://localhost:* (development only)
 *
 * No wildcard origins in production.
 */
export declare function corsMiddleware(): import("hono").MiddlewareHandler;
//# sourceMappingURL=cors.d.ts.map