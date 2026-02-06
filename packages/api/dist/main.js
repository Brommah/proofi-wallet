import { serve } from '@hono/node-server';
import { env } from './config/env.js';
import { app, jwtService } from './server.js';
import { VERSION } from './index.js';
async function main() {
    // Validate critical env vars in production
    if (env.NODE_ENV === 'production') {
        if (env.MASTER_SECRET.includes('dev-') || env.MASTER_SECRET.includes('CHANGE')) {
            console.error('\n🚨 FATAL: PROOFI_MASTER_SECRET appears to be a development fallback!');
            console.error('   Set a proper secret in production: openssl rand -hex 32\n');
            process.exit(1);
        }
    }
    // Wait for JWT keypair derivation
    await jwtService.ensureReady();
    console.log('✅ JWT signing key ready (deterministic from MASTER_SECRET)');
    serve({
        fetch: app.fetch,
        port: env.PORT,
    }, (info) => {
        console.log(`\n🔐 Proofi Auth API v${VERSION}`);
        console.log(`   → http://localhost:${info.port}`);
        console.log(`   → env: ${env.NODE_ENV}`);
        console.log(`   → CORS: ${env.CORS_ORIGINS.split(',').length} origins whitelisted`);
        console.log(`   → OTP store: ${env.NODE_ENV === 'production' ? 'HMAC (stateless)' : 'in-memory'}`);
        console.log(`   → User store: DDC-backed (no SQLite)\n`);
    });
}
main().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
});
//# sourceMappingURL=main.js.map