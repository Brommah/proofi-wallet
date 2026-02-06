/**
 * Creates a JWT verification middleware.
 * Attaches decoded payload to `c.set('jwtPayload', payload)`.
 */
export function authMiddleware(jwtService) {
    return async (c, next) => {
        const header = c.req.header('Authorization');
        if (!header?.startsWith('Bearer ')) {
            return c.json({ error: 'Missing or invalid Authorization header' }, 401);
        }
        const token = header.slice(7);
        try {
            const payload = await jwtService.verify(token);
            c.set('jwtPayload', payload);
            await next();
        }
        catch {
            return c.json({ error: 'Invalid or expired token' }, 401);
        }
    };
}
//# sourceMappingURL=auth.js.map