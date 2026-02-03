import { cors } from 'hono/cors';
import { env } from '../config/env.js';

export function corsMiddleware() {
  const origins = env.CORS_ORIGINS;

  if (origins === '*') {
    return cors({ origin: '*' });
  }

  const allowedOrigins = origins.split(',').map((o) => o.trim());
  return cors({
    origin: (origin) => (allowedOrigins.includes(origin) ? origin : ''),
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    exposeHeaders: ['Content-Length'],
    maxAge: 86400,
  });
}
