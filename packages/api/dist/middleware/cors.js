import { cors } from 'hono/cors';
import { env } from '../config/env.js';
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
export function corsMiddleware() {
    const allowedOrigins = env.CORS_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean);
    return cors({
        origin: (origin) => {
            if (!origin)
                return ''; // block no-origin requests
            // Exact match
            if (allowedOrigins.includes(origin))
                return origin;
            // In development: allow any localhost port
            if (env.NODE_ENV === 'development' && /^https?:\/\/localhost(:\d+)?$/.test(origin)) {
                return origin;
            }
            // Vercel preview URLs (proofi-*.vercel.app)
            if (/^https:\/\/proofi-[a-z0-9-]+\.vercel\.app$/.test(origin)) {
                return origin;
            }
            return ''; // deny
        },
        allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowHeaders: ['Content-Type', 'Authorization'],
        exposeHeaders: ['Content-Length', 'X-RateLimit-Limit', 'X-RateLimit-Remaining', 'Retry-After'],
        maxAge: 86400,
    });
}
//# sourceMappingURL=cors.js.map