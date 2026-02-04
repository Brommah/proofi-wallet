import { Hono } from 'hono';
import { env } from './config/env.js';
import { corsMiddleware } from './middleware/cors.js';
import { MemoryOtpStore } from './otp/store.js';
import { OtpService } from './otp/service.js';
import { createEmailSender } from './otp/email.js';
import { SqliteAppStore } from './apps/store.js';
import { SqliteUserStore } from './users/store.js';
// SqliteMemoStore kept for migration only - all NEW data goes to DDC index
import { SqliteMemoStore } from './memos/store.js';
import { JwtService } from './jwt/service.js';
import { generateDerivationSalt, deriveUserSeed, seedToHex } from './keys/derive.js';
import { verifySignatureAuth } from './auth/signature.js';
import {
  initDdc,
  storeCredential,
  storeMemo as ddcStoreMemo,
  readCredential,
  ddcRead,
  ddcStore,
  getIssuerAddress,
  getBucketId,
  readWalletIndex,
  addToWalletIndex,
} from './ddc/service.js';

const app = new Hono();

// ── Services ────────────────────────────────────────────────────────

export const jwtService = new JwtService();
const otpStore = new MemoryOtpStore();
const emailSender = createEmailSender();
const otpService = new OtpService(otpStore, emailSender);
const appStore = new SqliteAppStore();

// ── Persistent address store (email → wallet address) ───────────────
// SQLite-backed for persistence across server restarts
const userStore = new SqliteUserStore();

// ── Memo index: legacy SQLite (for migration) + DDC (new data) ──────
const legacyMemoStore = new SqliteMemoStore();

// Seed a dev app
if (env.NODE_ENV === 'development') {
  try {
    appStore.create({ appId: 'demo-app', name: 'Demo App', allowedOrigins: ['http://localhost:5173'] });
  } catch { /* already exists */ }
}

// ── Middleware ───────────────────────────────────────────────────────

app.use('*', corsMiddleware());

// ── Routes ──────────────────────────────────────────────────────────

app.get('/health', (c) => c.json({ status: 'ok', version: '0.3.1' }));
app.get('/', (c) => c.json({ name: 'Proofi Wallet API', version: '0.3.1', status: 'running' }));

// ── Balance (RPC proxy for mobile) ──────────────────────────────────

app.get('/balance/:address', async (c) => {
  const { address } = c.req.param();
  const RPC_ENDPOINTS = [
    'wss://archive.mainnet.cere.network/ws',
    'wss://rpc.mainnet.cere.network/ws',
  ];

  try {
    // Use polkadot.js API to query balance via RPC
    const { ApiPromise, WsProvider } = await import('@polkadot/api');
    const { decodeAddress, encodeAddress } = await import('@polkadot/util-crypto');

    // Normalize address (handle checksum issues)
    let normalizedAddr = address;
    try {
      const pubkey = decodeAddress(address, true); // ignoreChecksum
      normalizedAddr = encodeAddress(pubkey, 54);
    } catch {}

    const provider = new WsProvider(RPC_ENDPOINTS, 5000);
    const api = await ApiPromise.create({ provider, noInitWarn: true });

    try {
      const account = await api.query.system.account(normalizedAddr);
      const { free, reserved } = (account as any).data;
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
    } finally {
      await api.disconnect();
    }
  } catch (err: any) {
    console.error('[BALANCE] Error:', err.message);
    return c.json({ error: 'Failed to fetch balance', details: err.message }, 500);
  }
});

// JWKS endpoint
app.get('/.well-known/jwks.json', async (c) => {
  const jwks = await jwtService.getJwks();
  return c.json(jwks);
});

// OTP send
app.post('/auth/otp/send', async (c) => {
  const { email } = await c.req.json<{ email: string }>();
  if (!email) return c.json({ error: 'email required' }, 400);
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

// OTP verify → issue JWT + derivation salt (v2: client derives key with PIN, server NEVER sees private key)
app.post('/auth/otp/verify', async (c) => {
  const { email, code } = await c.req.json<{ email: string; code: string }>();
  if (!email || !code) return c.json({ error: 'email and code required' }, 400);
  const valid = await otpService.validateAndConsume(email, code);
  if (!valid) return c.json({ error: 'Invalid or expired OTP' }, 401);

  // v2: Server only sends derivation salt — client combines with PIN to derive key
  const derivationSalt = await generateDerivationSalt(email);
  const token = await jwtService.sign({ email });

  // Check if user already registered an address
  const existingAddress = userStore.getAddress(email);

  return c.json({
    token,
    email,
    derivationSalt,  // Client: PBKDF2(PIN, salt) → seed → keypair
    hasAddress: !!existingAddress,
    address: existingAddress || null,
  });
});

// Register wallet address (client derived key locally, sends only public address)
app.post('/auth/register-address', async (c) => {
  const auth = await getAuth(c);
  if (!auth) return c.json({ error: 'Authorization required' }, 401);

  const { address } = await c.req.json<{ address: string }>();
  if (!address || typeof address !== 'string') {
    return c.json({ error: 'address required' }, 400);
  }

  // Store email → address mapping (persistent)
  userStore.setAddress(auth.email, address);
  console.log(`🔑 Address registered for ${auth.email}: ${address}`);

  return c.json({ ok: true, email: auth.email, address });
});

// Get derivation salt (for returning users who need to re-derive their key)
app.post('/auth/derive', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Authorization required' }, 401);
  }
  try {
    const token = authHeader.slice(7);
    const payload = await jwtService.verify(token);
    const email = (payload.sub || (payload as any).email) as string;
    if (!email) return c.json({ error: 'Invalid token' }, 401);

    // v2: Only send derivation salt — client derives with PIN
    const derivationSalt = await generateDerivationSalt(email);
    const existingAddress = userStore.getAddress(email);

    return c.json({
      email,
      derivationSalt,  // Client: PBKDF2(PIN, salt) → seed → keypair
      hasAddress: !!existingAddress,
      address: existingAddress || null,
    });
  } catch {
    return c.json({ error: 'Invalid or expired token' }, 401);
  }
});

// ── Helper: extract auth ────────────────────────────────────────────

/**
 * Decentralized auth: supports wallet signature (primary) and JWT (legacy fallback).
 * 
 * Signature auth (preferred): Authorization: Signature {address}:{timestamp}:{signature}
 * JWT auth (legacy): Authorization: Bearer {token}
 */
async function getAuth(c: any): Promise<{ email: string; walletAddress: string } | null> {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return null;

  // ── Primary: Wallet Signature Auth (fully decentralized) ──
  if (authHeader.startsWith('Signature ')) {
    const result = await verifySignatureAuth(authHeader);
    if (!result.valid) {
      console.log(`❌ Signature auth failed: ${result.error}`);
      return null;
    }
    
    // Look up email for this address (optional — address is the identity)
    const email = userStore.getEmailByAddress(result.address) || `wallet:${result.address}`;
    console.log(`✅ Signature auth: ${result.address}`);
    return { email, walletAddress: result.address };
  }

  // ── Fallback: JWT Auth (legacy, for migration) ──
  if (authHeader.startsWith('Bearer ')) {
    try {
      const payload = await jwtService.verify(authHeader.slice(7));
      const email = (payload.sub || (payload as any).email) as string;
      if (!email) return null;

      // v2: Look up stored address (client-derived, never server-derived)
      const walletAddress = userStore.getAddress(email);
      if (!walletAddress) {
        // Fallback: user hasn't registered an address yet
        // Use email as identity placeholder (credentials still work, just no wallet address)
        return { email, walletAddress: `pending:${email}` };
      }

      return { email, walletAddress };
    } catch {
      return null;
    }
  }

  return null;
}

// ── DDC Routes (powered by cere-wallet.json) ────────────────────────

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
  } catch (e: any) {
    return c.json({ ok: false, error: e.message }, 500);
  }
});

// Store a memo on DDC (fully decentralized - index stored on DDC!)
app.post('/ddc/memo', async (c) => {
  const auth = await getAuth(c);
  if (!auth) return c.json({ error: 'Authorization required' }, 401);

  const { memo } = await c.req.json<{ memo: string }>();
  if (!memo) return c.json({ error: 'memo required' }, 400);

  // Require registered wallet address
  if (!auth.walletAddress || auth.walletAddress.startsWith('pending:')) {
    return c.json({ error: 'Wallet address not registered. Please complete wallet setup.' }, 400);
  }

  try {
    // storeMemo now also updates the decentralized index on DDC
    const result = await ddcStoreMemo(auth.email, auth.walletAddress, memo);
    console.log(`📝 Memo stored for ${auth.email} (${auth.walletAddress}): ${result.cid}`);
    
    return c.json({ ok: true, ...result });
  } catch (e: any) {
    console.error(`❌ DDC store error: ${e.message}`);
    return c.json({ error: e.message || 'Failed to store memo' }, 500);
  }
});

// Store a credential on DDC (fully decentralized - index stored on DDC!)
app.post('/ddc/credential', async (c) => {
  const auth = await getAuth(c);
  if (!auth) return c.json({ error: 'Authorization required' }, 401);

  const { claimType, claimData } = await c.req.json<{
    claimType: string;
    claimData: any;
  }>();

  if (!claimType || !claimData) {
    return c.json({ error: 'claimType and claimData required' }, 400);
  }

  try {
    // storeCredential now also updates the decentralized index on DDC
    const result = await storeCredential(auth.email, auth.walletAddress, claimType, claimData);
    console.log(`🎓 Credential stored for ${auth.email}: ${result.cid}`);
    
    return c.json({ ok: true, ...result });
  } catch (e: any) {
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
  } catch (e: any) {
    return c.json({ error: e.message || 'Failed to read' }, 500);
  }
});

// Verify a credential
app.get('/ddc/verify/:cid', async (c) => {
  const { cid } = c.req.param();
  try {
    const { credential, verified } = await readCredential(cid);
    return c.json({ ok: true, cid, verified, credential });
  } catch (e: any) {
    return c.json({ error: e.message || 'Failed to verify' }, 500);
  }
});

// List user's memos and credentials from DDC (fully decentralized!)
app.get('/ddc/list', async (c) => {
  const auth = await getAuth(c);
  if (!auth) return c.json({ error: 'Authorization required' }, 401);

  // Skip pending users without wallet address
  if (!auth.walletAddress || auth.walletAddress.startsWith('pending:')) {
    return c.json({ ok: true, count: 0, items: [] });
  }

  try {
    // Read index directly from DDC - no database!
    const index = await readWalletIndex(auth.walletAddress);
    return c.json({ 
      ok: true, 
      count: index.entries.length,
      items: index.entries,
    });
  } catch (e: any) {
    console.error(`❌ Failed to read wallet index: ${e.message}`);
    return c.json({ error: e.message || 'Failed to list items' }, 500);
  }
});

// List memos/credentials by wallet address (public endpoint for verification)
// Fully decentralized - reads directly from DDC!
app.get('/ddc/list/:walletAddress', async (c) => {
  const { walletAddress } = c.req.param();
  try {
    // Read index directly from DDC - no database!
    const index = await readWalletIndex(walletAddress);
    return c.json({ 
      ok: true, 
      walletAddress,
      count: index.entries.length,
      items: index.entries,
    });
  } catch (e: any) {
    console.error(`❌ Failed to read wallet index: ${e.message}`);
    return c.json({ error: e.message || 'Failed to list items' }, 500);
  }
});

// ── Migration: SQLite → DDC index (one-time use) ────────────────────

// Migrate old memos from SQLite to DDC index
app.post('/ddc/migrate', async (c) => {
  const auth = await getAuth(c);
  if (!auth) return c.json({ error: 'Authorization required' }, 401);

  if (!auth.walletAddress || auth.walletAddress.startsWith('pending:')) {
    return c.json({ error: 'Wallet address required' }, 400);
  }

  try {
    // Read legacy items from SQLite
    const legacyItems = legacyMemoStore.listByWallet(auth.walletAddress);
    
    if (legacyItems.length === 0) {
      return c.json({ ok: true, migrated: 0, message: 'No legacy items to migrate' });
    }

    // Read current DDC index
    const currentIndex = await readWalletIndex(auth.walletAddress);
    const existingCids = new Set(currentIndex.entries.map(e => e.cid));

    // Add each legacy item to DDC index (skip duplicates)
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
        console.log(`📦 Migrated ${item.type} ${item.cid} for ${auth.walletAddress}`);
      }
    }

    return c.json({ 
      ok: true, 
      migrated, 
      total: legacyItems.length,
      message: `Migrated ${migrated} items to DDC index`,
    });
  } catch (e: any) {
    console.error(`❌ Migration error: ${e.message}`);
    return c.json({ error: e.message || 'Migration failed' }, 500);
  }
});

// ── DDC Key Backup (encrypted client-side, stored server-side on DDC) ──

// In-memory index of backup CIDs per email
const backupIndex = new Map<string, string>();

// Store encrypted key backup on DDC
app.post('/ddc/backup', async (c) => {
  const auth = await getAuth(c);
  if (!auth) return c.json({ error: 'Authorization required' }, 401);

  const { encryptedSeed, iv, salt } = await c.req.json<{
    encryptedSeed: string; // base64-encoded AES-GCM ciphertext
    iv: string;            // base64-encoded IV
    salt: string;          // base64-encoded PBKDF2 salt used for encryption key
  }>();

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

    // Store CID in index for fast retrieval
    backupIndex.set(auth.email.toLowerCase().trim(), cid);
    console.log(`🔐 Key backup stored for ${auth.email}: ${cid}`);

    return c.json({ ok: true, cid });
  } catch (e: any) {
    console.error(`❌ Backup store error: ${e.message}`);
    return c.json({ error: e.message || 'Failed to store backup' }, 500);
  }
});

// Retrieve encrypted key backup from DDC
app.get('/ddc/backup/:email', async (c) => {
  // Auth required — only the user can fetch their own backup
  const auth = await getAuth(c);
  if (!auth) return c.json({ error: 'Authorization required' }, 401);

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
  } catch (e: any) {
    return c.json({ error: e.message || 'Failed to read backup' }, 500);
  }
});

// ── Game Achievement Routes ──────────────────────────────────────────

// Store a game achievement on DDC
app.post('/game/achievement', async (c) => {
  const auth = await getAuth(c);
  if (!auth) return c.json({ error: 'Authorization required' }, 401);

  const { game, score, achievement, data } = await c.req.json<{
    game: string;
    score?: number;
    achievement?: string;
    data?: any;
  }>();

  if (!game) return c.json({ error: 'game name required' }, 400);

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

    const result = await storeCredential(
      auth.email,
      auth.walletAddress,
      'GameAchievement',
      claimData,
    );
    console.log(`🎮 Achievement stored for ${auth.email}: ${game} - ${achievement || 'score'} (${score})`);

    return c.json({ ok: true, ...result });
  } catch (e: any) {
    console.error(`❌ Game achievement error: ${e.message}`);
    return c.json({ error: e.message || 'Failed to store achievement' }, 500);
  }
});

// Get achievements for a specific game (public endpoint)
app.get('/game/achievements/:walletAddress', async (c) => {
  const { walletAddress } = c.req.param();
  const game = c.req.query('game');

  try {
    const index = await readWalletIndex(walletAddress);
    let achievements = index.entries.filter(
      (e) => e.type === 'credential' && e.credentialType === 'GameAchievement',
    );

    // If game filter provided, we'd need to read each credential to filter
    // For now, return all game achievements
    return c.json({
      ok: true,
      walletAddress,
      count: achievements.length,
      achievements,
    });
  } catch (e: any) {
    return c.json({ error: e.message || 'Failed to fetch achievements' }, 500);
  }
});

// App registration
app.get('/apps/:appId', (c) => {
  const record = appStore.get(c.req.param('appId'));
  if (!record) return c.json({ error: 'App not found' }, 404);
  return c.json(record);
});

export { app };
