import { Hono } from 'hono';
import type { AppStore } from './store.js';

export function appsRoutes(store: AppStore) {
  const app = new Hono();

  /** Register a new app */
  app.post('/', async (c) => {
    const body = await c.req.json<{ appId: string; name: string; allowedOrigins?: string[] }>();

    if (!body.appId || !body.name) {
      return c.json({ error: 'appId and name are required' }, 400);
    }

    // Check if exists
    const existing = store.get(body.appId);
    if (existing) {
      return c.json({ error: 'App already exists' }, 409);
    }

    const record = store.create({
      appId: body.appId,
      name: body.name,
      allowedOrigins: body.allowedOrigins || [],
    });

    return c.json(record, 201);
  });

  /** Get app config */
  app.get('/:appId', (c) => {
    const appId = c.req.param('appId');
    const record = store.get(appId);

    if (!record) {
      return c.json({ error: 'App not found' }, 404);
    }

    return c.json(record);
  });

  /** List all apps */
  app.get('/', (c) => {
    return c.json(store.list());
  });

  return app;
}
