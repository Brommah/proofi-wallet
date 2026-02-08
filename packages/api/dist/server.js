import { Hono } from 'hono';
import { env } from './config/env.js';
import { corsMiddleware } from './middleware/cors.js';
import { cspMiddleware } from './middleware/csp.js';
import { globalRateLimit, otpRateLimit, ddcRateLimit } from './middleware/rateLimit.js';
import { HmacOtpStore, MemoryOtpStore } from './otp/store.js';
import { OtpService } from './otp/service.js';
import { createEmailSender } from './otp/email.js';
import { MemoryAppStore } from './apps/store.js';
import { DdcUserStore } from './users/store.js';
import { LegacyMemoStore } from './memos/store.js';
import { JwtService } from './jwt/service.js';
import { generateDerivationSalt } from './keys/derive.js';
import { verifySignatureAuth } from './auth/signature.js';
import { initDdc, storeCredential, storeMemo as ddcStoreMemo, readCredential, ddcRead, ddcStore, getIssuerAddress, getBucketId, readWalletIndex, addToWalletIndex, } from './ddc/service.js';
const app = new Hono();
// ── Services ────────────────────────────────────────────────────────
export const jwtService = new JwtService();
// OTP: Use HMAC-based stateless store in production, memory in development
const otpStore = env.NODE_ENV === 'production'
    ? new HmacOtpStore(env.MASTER_SECRET)
    : new MemoryOtpStore();
const emailSender = createEmailSender();
const otpService = new OtpService(otpStore, emailSender);
const appStore = new MemoryAppStore();
// DDC-backed user store (email → wallet address)
const userStore = new DdcUserStore();
// Legacy memo store stub (for migration endpoint only)
const legacyMemoStore = new LegacyMemoStore();
// Seed a dev app
if (env.NODE_ENV === 'development') {
    try {
        appStore.create({ appId: 'demo-app', name: 'Demo App', allowedOrigins: ['http://localhost:5173'] });
    }
    catch { /* already exists */ }
}
// ── Middleware ───────────────────────────────────────────────────────
app.use('*', corsMiddleware());
app.use('*', cspMiddleware());
app.use('*', globalRateLimit());
// ── Routes ──────────────────────────────────────────────────────────
app.get('/health', (c) => c.json({ status: 'ok', version: '0.3.2' }));
app.get('/', (c) => c.json({ name: 'Proofi Wallet API', version: '0.3.2', status: 'running' }));
// ── Balance (RPC proxy for mobile) ──────────────────────────────────
app.get('/balance/:address', async (c) => {
    const { address } = c.req.param();
    const RPC_ENDPOINTS = [
        'wss://archive.mainnet.cere.network/ws',
        'wss://rpc.mainnet.cere.network/ws',
    ];
    try {
        const { ApiPromise, WsProvider } = await import('@polkadot/api');
        const { decodeAddress, encodeAddress } = await import('@polkadot/util-crypto');
        let normalizedAddr = address;
        try {
            const pubkey = decodeAddress(address, true);
            normalizedAddr = encodeAddress(pubkey, 54);
        }
        catch { }
        const provider = new WsProvider(RPC_ENDPOINTS, 5000);
        const api = await ApiPromise.create({ provider, noInitWarn: true });
        try {
            const account = await api.query.system.account(normalizedAddr);
            const { free, reserved } = account.data;
            const freeBn = BigInt(free.toString());
            const reservedBn = BigInt(reserved.toString());
            const decimals = 10;
            const whole = freeBn / BigInt(10 ** decimals);
            const frac = freeBn % BigInt(10 ** decimals);
            const formatted = `${whole}.${frac.toString().padStart(decimals, '0').slice(0, 2)} CERE`;
            return c.json({
                free: free.toString(),
                reserved: reserved.toString(),
                total: (freeBn + reservedBn).toString(),
                formatted,
                address: normalizedAddr,
            });
        }
        finally {
            await api.disconnect();
        }
    }
    catch (err) {
        console.error('[BALANCE] Error:', err.message);
        return c.json({ error: 'Failed to fetch balance', details: err.message }, 500);
    }
});
// JWKS endpoint
app.get('/.well-known/jwks.json', async (c) => {
    const jwks = await jwtService.getJwks();
    return c.json(jwks);
});
// OTP send — with rate limiting
app.post('/auth/otp/send', otpRateLimit(), async (c) => {
    const { email } = await c.req.json();
    if (!email)
        return c.json({ error: 'email required' }, 400);
    const result = await otpService.send(email);
    // Dev mode: include OTP in response for auto-fill (only when no SMTP)
    if (env.NODE_ENV === 'development' && !env.SMTP_HOST) {
        const record = await otpService.peek(email);
        if (record) {
            return c.json({ ...result, devCode: record.code });
        }
    }
    return c.json(result);
});
// OTP verify → issue JWT + derivation salt
app.post('/auth/otp/verify', async (c) => {
    const { email, code } = await c.req.json();
    if (!email || !code)
        return c.json({ error: 'email and code required' }, 400);
    const valid = await otpService.validateAndConsume(email, code);
    if (!valid)
        return c.json({ error: 'Invalid or expired OTP' }, 401);
    const derivationSalt = await generateDerivationSalt(email);
    const token = await jwtService.sign({ email });
    const existingAddress = userStore.getAddress(email);
    return c.json({
        token,
        email,
        derivationSalt,
        hasAddress: !!existingAddress,
        address: existingAddress || null,
    });
});
// Register wallet address
app.post('/auth/register-address', async (c) => {
    const auth = await getAuth(c);
    if (!auth)
        return c.json({ error: 'Authorization required' }, 401);
    const { address } = await c.req.json();
    if (!address || typeof address !== 'string') {
        return c.json({ error: 'address required' }, 400);
    }
    userStore.setAddress(auth.email, address);
    console.log(`🔑 Address registered for ${auth.email}: ${address}`);
    return c.json({ ok: true, email: auth.email, address });
});
// Get derivation salt (for returning users)
app.post('/auth/derive', async (c) => {
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return c.json({ error: 'Authorization required' }, 401);
    }
    try {
        const token = authHeader.slice(7);
        const payload = await jwtService.verify(token);
        const email = (payload.sub || payload.email);
        if (!email)
            return c.json({ error: 'Invalid token' }, 401);
        const derivationSalt = await generateDerivationSalt(email);
        const existingAddress = userStore.getAddress(email);
        return c.json({
            email,
            derivationSalt,
            hasAddress: !!existingAddress,
            address: existingAddress || null,
        });
    }
    catch {
        return c.json({ error: 'Invalid or expired token' }, 401);
    }
});
// ── Wallet recovery endpoint ────────────────────────────────────────
app.post('/auth/recover', async (c) => {
    const { email, code, newAddress, oldAddress } = await c.req.json();
    if (!email || !code || !newAddress) {
        return c.json({ error: 'email, code, and newAddress required' }, 400);
    }
    // Verify OTP
    const valid = await otpService.validateAndConsume(email, code);
    if (!valid)
        return c.json({ error: 'Invalid or expired OTP' }, 401);
    // Get the old address for this email (if any)
    const previousAddress = oldAddress || userStore.getAddress(email);
    // Update to new address
    userStore.setAddress(email, newAddress);
    const derivationSalt = await generateDerivationSalt(email);
    const token = await jwtService.sign({ email });
    console.log(`🔄 Wallet recovered for ${email}: ${previousAddress || 'none'} → ${newAddress}`);
    // If there was an old address, store a recovery credential on DDC
    if (previousAddress && previousAddress !== newAddress) {
        try {
            await storeCredential(email, newAddress, 'WalletRecovery', {
                previousAddress,
                newAddress,
                recoveryTimestamp: new Date().toISOString(),
                reason: 'pin-recovery',
            });
            console.log(`📋 Recovery credential stored linking ${previousAddress} → ${newAddress}`);
        }
        catch (e) {
            console.error(`⚠️ Failed to store recovery credential: ${e.message}`);
        }
    }
    return c.json({
        ok: true,
        token,
        email,
        derivationSalt,
        previousAddress: previousAddress || null,
        newAddress,
    });
});
// ── Helper: extract auth ────────────────────────────────────────────
async function getAuth(c) {
    const authHeader = c.req.header('Authorization');
    if (!authHeader)
        return null;
    // Primary: Wallet Signature Auth (fully decentralized)
    if (authHeader.startsWith('Signature ')) {
        const result = await verifySignatureAuth(authHeader);
        if (!result.valid) {
            console.log(`❌ Signature auth failed: ${result.error}`);
            return null;
        }
        const email = userStore.getEmailByAddress(result.address) || `wallet:${result.address}`;
        console.log(`✅ Signature auth: ${result.address}`);
        return { email, walletAddress: result.address };
    }
    // Fallback: JWT Auth (legacy)
    if (authHeader.startsWith('Bearer ')) {
        try {
            const payload = await jwtService.verify(authHeader.slice(7));
            const email = (payload.sub || payload.email);
            if (!email)
                return null;
            const walletAddress = userStore.getAddress(email);
            if (!walletAddress) {
                return { email, walletAddress: `pending:${email}` };
            }
            return { email, walletAddress };
        }
        catch {
            return null;
        }
    }
    return null;
}
// ── DDC Routes ──────────────────────────────────────────────────────
// DDC status
app.get('/ddc/status', async (c) => {
    try {
        await initDdc();
        return c.json({
            ok: true,
            connected: true,
            issuerWallet: getIssuerAddress(),
            bucket: getBucketId(),
            network: 'mainnet',
        });
    }
    catch (e) {
        return c.json({ ok: false, error: e.message }, 500);
    }
});
// Store raw content directly to DDC bucket (no memo wrapping)
app.post('/ddc/store', ddcRateLimit(), async (c) => {
    const auth = await getAuth(c);
    if (!auth)
        return c.json({ error: 'Authorization required' }, 401);
    const { content, tags } = await c.req.json();
    if (!content)
        return c.json({ error: 'content required' }, 400);
    try {
        const rawContent = typeof content === 'string' ? content : JSON.stringify(content);
        const ddcTags = Array.isArray(tags) ? tags : [];
        const cid = await ddcStore(rawContent, ddcTags);
        console.log(`📦 Raw DDC store for ${auth.email}: ${cid}`);
        return c.json({
            ok: true,
            cid,
            bucket: getBucketId(),
            cdnUrl: `https://cdn.ddc-dragon.com/${getBucketId()}/${cid}`
        });
    }
    catch (e) {
        console.error(`❌ DDC raw store error: ${e.message}`);
        return c.json({ error: e.message || 'Failed to store' }, 500);
    }
});
// Store a memo on DDC — with rate limiting
app.post('/ddc/memo', ddcRateLimit(), async (c) => {
    const auth = await getAuth(c);
    if (!auth)
        return c.json({ error: 'Authorization required' }, 401);
    const { memo } = await c.req.json();
    if (!memo)
        return c.json({ error: 'memo required' }, 400);
    if (!auth.walletAddress || auth.walletAddress.startsWith('pending:')) {
        return c.json({ error: 'Wallet address not registered. Please complete wallet setup.' }, 400);
    }
    try {
        const result = await ddcStoreMemo(auth.email, auth.walletAddress, memo);
        console.log(`📝 Memo stored for ${auth.email} (${auth.walletAddress}): ${result.cid}`);
        return c.json({ ok: true, ...result });
    }
    catch (e) {
        console.error(`❌ DDC store error: ${e.message}`);
        return c.json({ error: e.message || 'Failed to store memo' }, 500);
    }
});
// Store a credential on DDC — with rate limiting
app.post('/ddc/credential', ddcRateLimit(), async (c) => {
    const auth = await getAuth(c);
    if (!auth)
        return c.json({ error: 'Authorization required' }, 401);
    const { claimType, claimData } = await c.req.json();
    if (!claimType || !claimData) {
        return c.json({ error: 'claimType and claimData required' }, 400);
    }
    try {
        const result = await storeCredential(auth.email, auth.walletAddress, claimType, claimData);
        console.log(`🎓 Credential stored for ${auth.email}: ${result.cid}`);
        return c.json({ ok: true, ...result });
    }
    catch (e) {
        console.error(`❌ DDC credential error: ${e.message}`);
        return c.json({ error: e.message || 'Failed to store credential' }, 500);
    }
});
// Read from DDC
app.get('/ddc/read/:cid', async (c) => {
    const { cid } = c.req.param();
    try {
        const content = await ddcRead(cid);
        return c.json({ ok: true, cid, content: JSON.parse(content) });
    }
    catch (e) {
        return c.json({ error: e.message || 'Failed to read' }, 500);
    }
});
// Verify a credential
app.get('/ddc/verify/:cid', async (c) => {
    const { cid } = c.req.param();
    try {
        const { credential, verified } = await readCredential(cid);
        return c.json({ ok: true, cid, verified, credential });
    }
    catch (e) {
        return c.json({ error: e.message || 'Failed to verify' }, 500);
    }
});
// List user's items from DDC
app.get('/ddc/list', async (c) => {
    const auth = await getAuth(c);
    if (!auth)
        return c.json({ error: 'Authorization required' }, 401);
    if (!auth.walletAddress || auth.walletAddress.startsWith('pending:')) {
        return c.json({ ok: true, count: 0, items: [] });
    }
    try {
        const index = await readWalletIndex(auth.walletAddress);
        return c.json({
            ok: true,
            count: index.entries.length,
            items: index.entries,
        });
    }
    catch (e) {
        console.error(`❌ Failed to read wallet index: ${e.message}`);
        return c.json({ error: e.message || 'Failed to list items' }, 500);
    }
});
// List by wallet address (public endpoint)
app.get('/ddc/list/:walletAddress', async (c) => {
    const { walletAddress } = c.req.param();
    try {
        const index = await readWalletIndex(walletAddress);
        return c.json({
            ok: true,
            walletAddress,
            count: index.entries.length,
            items: index.entries,
        });
    }
    catch (e) {
        console.error(`❌ Failed to read wallet index: ${e.message}`);
        return c.json({ error: e.message || 'Failed to list items' }, 500);
    }
});
// Migration endpoint (legacy SQLite → DDC)
app.post('/ddc/migrate', async (c) => {
    const auth = await getAuth(c);
    if (!auth)
        return c.json({ error: 'Authorization required' }, 401);
    if (!auth.walletAddress || auth.walletAddress.startsWith('pending:')) {
        return c.json({ error: 'Wallet address required' }, 400);
    }
    try {
        const legacyItems = legacyMemoStore.listByWallet(auth.walletAddress);
        if (legacyItems.length === 0) {
            return c.json({ ok: true, migrated: 0, message: 'No legacy items to migrate' });
        }
        const currentIndex = await readWalletIndex(auth.walletAddress);
        const existingCids = new Set(currentIndex.entries.map(e => e.cid));
        let migrated = 0;
        for (const item of legacyItems) {
            if (!existingCids.has(item.cid)) {
                await addToWalletIndex(auth.walletAddress, {
                    cid: item.cid,
                    cdnUrl: item.cdnUrl,
                    type: item.type,
                    credentialType: item.credentialType,
                });
                migrated++;
            }
        }
        return c.json({
            ok: true,
            migrated,
            total: legacyItems.length,
            message: `Migrated ${migrated} items to DDC index`,
        });
    }
    catch (e) {
        console.error(`❌ Migration error: ${e.message}`);
        return c.json({ error: e.message || 'Migration failed' }, 500);
    }
});
// ── DDC Key Backup ──────────────────────────────────────────────────
// In-memory index of backup CIDs per email (cache — DDC is source of truth)
const backupIndex = new Map();
app.post('/ddc/backup', ddcRateLimit(), async (c) => {
    const auth = await getAuth(c);
    if (!auth)
        return c.json({ error: 'Authorization required' }, 401);
    const { encryptedSeed, iv, salt } = await c.req.json();
    if (!encryptedSeed || !iv) {
        return c.json({ error: 'encryptedSeed and iv required' }, 400);
    }
    try {
        const backupData = JSON.stringify({
            type: 'proofi-key-backup-v2',
            email: auth.email,
            encryptedSeed,
            iv,
            salt: salt || '',
            createdAt: new Date().toISOString(),
        });
        const cid = await ddcStore(backupData, [
            { key: 'type', value: 'key-backup' },
            { key: 'email', value: auth.email },
            { key: 'version', value: 'v2' },
        ]);
        backupIndex.set(auth.email.toLowerCase().trim(), cid);
        console.log(`🔐 Key backup stored for ${auth.email}: ${cid}`);
        return c.json({ ok: true, cid });
    }
    catch (e) {
        console.error(`❌ Backup store error: ${e.message}`);
        return c.json({ error: e.message || 'Failed to store backup' }, 500);
    }
});
app.get('/ddc/backup/:email', async (c) => {
    const auth = await getAuth(c);
    if (!auth)
        return c.json({ error: 'Authorization required' }, 401);
    const requestedEmail = decodeURIComponent(c.req.param('email')).toLowerCase().trim();
    if (auth.email.toLowerCase().trim() !== requestedEmail) {
        return c.json({ error: 'Unauthorized — can only access your own backup' }, 403);
    }
    const cid = backupIndex.get(requestedEmail);
    if (!cid) {
        return c.json({ error: 'No backup found', hasBackup: false }, 404);
    }
    try {
        const content = await ddcRead(cid);
        const backup = JSON.parse(content);
        return c.json({ ok: true, hasBackup: true, ...backup });
    }
    catch (e) {
        return c.json({ error: e.message || 'Failed to read backup' }, 500);
    }
});
// ── Game Achievement Routes ──────────────────────────────────────────
app.post('/game/achievement', ddcRateLimit(), async (c) => {
    const auth = await getAuth(c);
    if (!auth)
        return c.json({ error: 'Authorization required' }, 401);
    const { game, score, achievement, data } = await c.req.json();
    if (!game)
        return c.json({ error: 'game name required' }, 400);
    if (!auth.walletAddress || auth.walletAddress.startsWith('pending:')) {
        return c.json({ error: 'Wallet address not registered. Please complete wallet setup.' }, 400);
    }
    try {
        const claimData = {
            game,
            score: score ?? 0,
            achievement: achievement ?? 'score',
            timestamp: new Date().toISOString(),
            ...(data || {}),
        };
        const result = await storeCredential(auth.email, auth.walletAddress, 'GameAchievement', claimData);
        console.log(`🎮 Achievement stored for ${auth.email}: ${game} - ${achievement || 'score'} (${score})`);
        return c.json({ ok: true, ...result });
    }
    catch (e) {
        console.error(`❌ Game achievement error: ${e.message}`);
        return c.json({ error: e.message || 'Failed to store achievement' }, 500);
    }
});
app.get('/game/achievements/:walletAddress', async (c) => {
    const { walletAddress } = c.req.param();
    try {
        const index = await readWalletIndex(walletAddress);
        const achievements = index.entries.filter((e) => e.type === 'credential' && e.credentialType === 'GameAchievement');
        return c.json({
            ok: true,
            walletAddress,
            count: achievements.length,
            achievements,
        });
    }
    catch (e) {
        return c.json({ error: e.message || 'Failed to fetch achievements' }, 500);
    }
});
// App registration
app.get('/apps/:appId', (c) => {
    const record = appStore.get(c.req.param('appId'));
    if (!record)
        return c.json({ error: 'App not found' }, 404);
    return c.json(record);
});

// ── ProofiDrop - P2P File Transfer ──────────────────────────────────

const dropIndex = new Map();

app.post('/drop/upload', ddcRateLimit(), async (c) => {
    const auth = await getAuth(c);
    const body = await c.req.json();
    const { fileName, fileType, fileSize, fileData, sender, recipient, expiresIn, maxDownloads } = body;
    if (!fileName || !fileData || !sender) {
        return c.json({ error: 'fileName, fileData, and sender required' }, 400);
    }
    if (fileSize > 100 * 1024 * 1024) {
        return c.json({ error: 'File too large. Max 100MB.' }, 400);
    }
    try {
        const dropId = 'drop_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
        const dropData = JSON.stringify({
            type: 'proofi-drop-v1',
            dropId,
            fileName,
            fileType,
            fileSize,
            fileData,
            sender,
            recipient: recipient || null,
            createdAt: Date.now(),
        });
        const cid = await ddcStore(dropData, [
            { key: 'type', value: 'proofi-drop' },
            { key: 'dropId', value: dropId },
            { key: 'sender', value: sender },
            { key: 'recipient', value: recipient || 'anyone' },
        ]);
        const expiresAt = expiresIn && expiresIn > 0 ? Date.now() + (expiresIn * 1000) : null;
        dropIndex.set(dropId, {
            dropId, cid, fileName, fileType, fileSize, sender,
            recipient: recipient || null, expiresAt,
            maxDownloads: maxDownloads || 0, downloadCount: 0, createdAt: Date.now(),
        });
        try {
            await addToWalletIndex(sender, {
                type: 'drop', dropId, cid, fileName, fileSize,
                recipient: recipient || 'anyone', direction: 'sent', timestamp: Date.now(),
            });
        } catch (e) { console.warn('Could not add to sender index:', e); }
        if (recipient) {
            try {
                await addToWalletIndex(recipient, {
                    type: 'drop', dropId, cid, fileName, fileSize,
                    sender, direction: 'received', timestamp: Date.now(),
                });
            } catch (e) { console.warn('Could not add to recipient index:', e); }
        }
        console.log(`📦 ProofiDrop uploaded: ${dropId} (${fileName}, ${fileSize} bytes) from ${sender}`);
        return c.json({ ok: true, dropId, cid });
    } catch (e) {
        console.error(`❌ Drop upload error: ${e.message}`);
        return c.json({ error: e.message || 'Failed to upload file' }, 500);
    }
});

app.get('/drop/download/:dropId', async (c) => {
    const { dropId } = c.req.param();
    const wallet = c.req.query('wallet');
    const drop = dropIndex.get(dropId);
    if (!drop) {
        return c.json({ error: 'Drop not found or expired' }, 404);
    }
    if (drop.expiresAt && Date.now() > drop.expiresAt) {
        dropIndex.delete(dropId);
        return c.json({ error: 'This drop has expired' }, 410);
    }
    if (drop.recipient && wallet && drop.recipient !== wallet) {
        return c.json({ error: 'This drop is restricted to a specific recipient' }, 403);
    }
    if (drop.maxDownloads > 0 && drop.downloadCount >= drop.maxDownloads) {
        return c.json({ error: 'Download limit reached' }, 410);
    }
    try {
        const content = await ddcRead(drop.cid);
        const data = JSON.parse(content);
        drop.downloadCount++;
        console.log(`📥 ProofiDrop downloaded: ${dropId} by ${wallet || 'anonymous'} (${drop.downloadCount}/${drop.maxDownloads || '∞'})`);
        return c.json({
            ok: true, fileName: data.fileName, fileType: data.fileType,
            fileSize: data.fileSize, fileData: data.fileData, sender: data.sender,
        });
    } catch (e) {
        console.error(`❌ Drop download error: ${e.message}`);
        return c.json({ error: e.message || 'Failed to download file' }, 500);
    }
});

app.get('/drop/inbox/:walletAddress', async (c) => {
    const { walletAddress } = c.req.param();
    try {
        const index = await readWalletIndex(walletAddress);
        const drops = index.entries
            .filter((e) => e.type === 'drop' && e.direction === 'received')
            .map((e) => {
                const meta = dropIndex.get(e.dropId);
                return {
                    dropId: e.dropId, fileName: e.fileName, fileSize: e.fileSize,
                    sender: e.sender, createdAt: e.timestamp,
                    expired: meta?.expiresAt ? Date.now() > meta.expiresAt : false,
                };
            })
            .filter((d) => !d.expired);
        return c.json({ ok: true, files: drops });
    } catch (e) {
        return c.json({ ok: true, files: [] });
    }
});

app.get('/drop/sent/:walletAddress', async (c) => {
    const { walletAddress } = c.req.param();
    try {
        const index = await readWalletIndex(walletAddress);
        const drops = index.entries
            .filter((e) => e.type === 'drop' && e.direction === 'sent')
            .map((e) => ({
                dropId: e.dropId, fileName: e.fileName, fileSize: e.fileSize,
                recipient: e.recipient, createdAt: e.timestamp,
            }));
        return c.json({ ok: true, files: drops });
    } catch (e) {
        return c.json({ ok: true, files: [] });
    }
});

export { app };
//# sourceMappingURL=server.js.map