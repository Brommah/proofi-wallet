import { serve } from '@hono/node-server';
import { env } from './config/env.js';
import { app, jwtService } from './server.js';
import { VERSION } from './index.js';

async function main() {
  // Wait for JWT keypair generation
  await jwtService.ensureReady();

  serve({
    fetch: app.fetch,
    port: env.PORT,
  }, (info) => {
    console.log(`\n🔐 Proofi Auth API v${VERSION}`);
    console.log(`   → http://localhost:${info.port}`);
    console.log(`   → env: ${env.NODE_ENV}\n`);
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
