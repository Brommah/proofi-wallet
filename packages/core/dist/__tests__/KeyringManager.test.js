import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { mnemonicValidate } from '@polkadot/util-crypto';
import { u8aToHex } from '@polkadot/util';
import nacl from 'tweetnacl';
import { KeyringManager } from '../keyring/KeyringManager';
// A known-good mnemonic for deterministic tests
const TEST_MNEMONIC = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
describe('KeyringManager', () => {
    let mgr;
    beforeAll(async () => {
        // Warm up WASM once for the whole suite
        const warmup = new KeyringManager();
        await warmup.init();
    });
    beforeEach(async () => {
        mgr = new KeyringManager();
        await mgr.init();
    });
    // ── 1. Mnemonic generation ──────────────────────────────────────────────
    describe('generateMnemonic', () => {
        it('generates a 12-word mnemonic', () => {
            const mnemonic = mgr.generateMnemonic();
            const words = mnemonic.trim().split(/\s+/);
            expect(words).toHaveLength(12);
        });
        it('generates a valid BIP39 mnemonic', () => {
            const mnemonic = mgr.generateMnemonic();
            expect(mnemonicValidate(mnemonic)).toBe(true);
        });
        it('generates unique mnemonics each time', () => {
            const a = mgr.generateMnemonic();
            const b = mgr.generateMnemonic();
            expect(a).not.toBe(b);
        });
    });
    // ── 2. Ed25519 derivation ──────────────────────────────────────────────
    describe('derive ed25519', () => {
        beforeEach(() => {
            mgr.setMnemonic(TEST_MNEMONIC);
        });
        it('derives an ed25519 keypair from mnemonic', () => {
            const pair = mgr.derive({ type: 'ed25519', label: 'ed-test' });
            expect(pair.type).toBe('ed25519');
            expect(pair.address).toBeTruthy();
            expect(pair.publicKey).toBeInstanceOf(Uint8Array);
            expect(pair.publicKey.length).toBe(32);
            expect(pair.label).toBe('ed-test');
        });
        it('derives different keys with different indices', () => {
            const a = mgr.derive({ type: 'ed25519' });
            const b = mgr.derive({ type: 'ed25519' });
            expect(a.address).not.toBe(b.address);
        });
        it('derives the same key from the same mnemonic deterministically', () => {
            const a = mgr.derive({ type: 'ed25519' });
            // Reset and re-derive
            const mgr2 = new KeyringManager();
            // init already done via WASM being ready globally
            mgr2['ready'] = true; // skip re-init for speed
            mgr2.setMnemonic(TEST_MNEMONIC);
            const b = mgr2.derive({ type: 'ed25519' });
            expect(a.address).toBe(b.address);
        });
    });
    // ── 3. Sr25519 derivation ──────────────────────────────────────────────
    describe('derive sr25519', () => {
        beforeEach(() => {
            mgr.setMnemonic(TEST_MNEMONIC);
        });
        it('derives an sr25519 keypair from mnemonic', () => {
            const pair = mgr.derive({ type: 'sr25519', label: 'sr-test' });
            expect(pair.type).toBe('sr25519');
            expect(pair.address).toBeTruthy();
            expect(pair.publicKey).toBeInstanceOf(Uint8Array);
            expect(pair.publicKey.length).toBe(32);
        });
        it('produces different addresses from ed25519 with the same mnemonic', () => {
            const ed = mgr.derive({ type: 'ed25519' });
            const sr = mgr.derive({ type: 'sr25519' });
            // Different crypto → different addresses
            expect(ed.address).not.toBe(sr.address);
        });
    });
    // ── 4. Secp256k1 derivation ────────────────────────────────────────────
    describe('derive secp256k1', () => {
        beforeEach(() => {
            mgr.setMnemonic(TEST_MNEMONIC);
        });
        it('derives a secp256k1 (Ethereum) keypair', () => {
            const pair = mgr.derive({ type: 'secp256k1', label: 'eth-test' });
            expect(pair.type).toBe('secp256k1');
            expect(pair.address).toMatch(/^0x[0-9a-fA-F]{40}$/);
            expect(pair.publicKey).toBeInstanceOf(Uint8Array);
        });
        it('uses BIP-44 path by default', () => {
            const a = mgr.derive({ type: 'secp256k1' });
            const b = mgr.derive({ type: 'secp256k1' });
            expect(a.address).not.toBe(b.address);
        });
        it('uses custom derivation path', () => {
            const pair = mgr.derive({
                type: 'secp256k1',
                derivationPath: "m/44'/60'/0'/0/42",
            });
            expect(pair.address).toMatch(/^0x/);
        });
    });
    // ── 5. Raw key import (ed25519) ────────────────────────────────────────
    describe('importKey (ed25519)', () => {
        it('imports a 32-byte ed25519 seed', () => {
            const seed = nacl.randomBytes(32);
            const pair = mgr.importKey({
                type: 'ed25519',
                secretKey: seed,
                label: 'imported-ed',
            });
            expect(pair.type).toBe('ed25519');
            expect(pair.address).toBeTruthy();
            expect(pair.label).toBe('imported-ed');
        });
        it('imports a 64-byte ed25519 full keypair', () => {
            const naclPair = nacl.sign.keyPair();
            const pair = mgr.importKey({
                type: 'ed25519',
                secretKey: naclPair.secretKey,
            });
            expect(pair.publicKey).toEqual(new Uint8Array(naclPair.publicKey));
        });
        it('imports from hex string', () => {
            const seed = nacl.randomBytes(32);
            const hex = u8aToHex(seed);
            const pair = mgr.importKey({ type: 'ed25519', secretKey: hex });
            expect(pair.address).toBeTruthy();
        });
        it('imports from hex string without 0x prefix', () => {
            const seed = nacl.randomBytes(32);
            const hex = u8aToHex(seed).slice(2); // strip 0x
            const pair = mgr.importKey({ type: 'ed25519', secretKey: hex });
            expect(pair.address).toBeTruthy();
        });
    });
    // ── 6. Signing and verification ────────────────────────────────────────
    describe('signing and verification', () => {
        it('signs a message with ed25519 and verifies with tweetnacl', () => {
            const seed = nacl.randomBytes(32);
            const pair = mgr.importKey({ type: 'ed25519', secretKey: seed });
            const internal = mgr.getPair(pair.id);
            expect(internal).toBeDefined();
            expect(internal._polkadotPair).toBeDefined();
            const message = new TextEncoder().encode('hello proofi');
            const signature = internal._polkadotPair.sign(message);
            // Verify with tweetnacl
            const naclPair = nacl.sign.keyPair.fromSeed(seed);
            const valid = nacl.sign.detached.verify(message, signature, naclPair.publicKey);
            expect(valid).toBe(true);
        });
        it('signs a message with sr25519 via polkadot pair', () => {
            mgr.setMnemonic(TEST_MNEMONIC);
            const pair = mgr.derive({ type: 'sr25519' });
            const internal = mgr.getPair(pair.id);
            expect(internal._polkadotPair).toBeDefined();
            const message = new TextEncoder().encode('hello sr25519');
            const signature = internal._polkadotPair.sign(message);
            const valid = internal._polkadotPair.verify(message, signature, internal.publicKey);
            expect(valid).toBe(true);
        });
        it('signs with secp256k1 via ethers wallet', async () => {
            mgr.setMnemonic(TEST_MNEMONIC);
            const pair = mgr.derive({ type: 'secp256k1' });
            const internal = mgr.getPair(pair.id);
            expect(internal._ethersWallet).toBeDefined();
            const message = 'hello ethereum';
            const signature = await internal._ethersWallet.signMessage(message);
            expect(signature).toMatch(/^0x[0-9a-fA-F]+$/);
        });
    });
    // ── 7. Scoped signing (purposes) ──────────────────────────────────────
    describe('scoped signing / purposes', () => {
        beforeEach(() => {
            mgr.setMnemonic(TEST_MNEMONIC);
        });
        it('stores and retrieves pairs by purpose', () => {
            mgr.derive({ type: 'ed25519', purposes: ['credential'] });
            mgr.derive({ type: 'ed25519', purposes: ['transaction'] });
            mgr.derive({ type: 'ed25519', purposes: ['credential', 'authentication'] });
            const credPairs = mgr.getPairsByPurpose('credential');
            expect(credPairs).toHaveLength(2);
            const txPairs = mgr.getPairsByPurpose('transaction');
            expect(txPairs).toHaveLength(1);
            const authPairs = mgr.getPairsByPurpose('authentication');
            expect(authPairs).toHaveLength(1);
        });
        it('returns empty array for unknown purpose', () => {
            mgr.derive({ type: 'ed25519', purposes: ['transaction'] });
            const pairs = mgr.getPairsByPurpose('encryption');
            expect(pairs).toHaveLength(0);
        });
        it('pairs without purposes are not returned by getPairsByPurpose', () => {
            mgr.derive({ type: 'ed25519' }); // no purposes
            const pairs = mgr.getPairsByPurpose('credential');
            expect(pairs).toHaveLength(0);
        });
    });
    // ── 8. Multiple keypairs ───────────────────────────────────────────────
    describe('multiple keypairs', () => {
        beforeEach(() => {
            mgr.setMnemonic(TEST_MNEMONIC);
        });
        it('manages multiple keypairs of different types', () => {
            mgr.derive({ type: 'ed25519' });
            mgr.derive({ type: 'sr25519' });
            mgr.derive({ type: 'secp256k1' });
            expect(mgr.size).toBe(3);
            expect(mgr.getPairsByType('ed25519')).toHaveLength(1);
            expect(mgr.getPairsByType('sr25519')).toHaveLength(1);
            expect(mgr.getPairsByType('secp256k1')).toHaveLength(1);
        });
        it('getAllPairs returns all stored pairs', () => {
            mgr.derive({ type: 'ed25519' });
            mgr.derive({ type: 'ed25519' });
            mgr.derive({ type: 'sr25519' });
            const all = mgr.getAllPairs();
            expect(all).toHaveLength(3);
        });
        it('removes a pair by id', () => {
            const pair = mgr.derive({ type: 'ed25519' });
            expect(mgr.size).toBe(1);
            const removed = mgr.removePair(pair.id);
            expect(removed).toBe(true);
            expect(mgr.size).toBe(0);
        });
        it('clear removes all pairs but keeps mnemonic', () => {
            mgr.derive({ type: 'ed25519' });
            mgr.derive({ type: 'sr25519' });
            mgr.clear();
            expect(mgr.size).toBe(0);
            expect(mgr.getMnemonic()).toBe(TEST_MNEMONIC);
        });
    });
    // ── 9. Export / import round-trip ──────────────────────────────────────
    describe('export / import round-trip', () => {
        it('exports an ed25519 keypair and reimports it', () => {
            const seed = nacl.randomBytes(32);
            const original = mgr.importKey({ type: 'ed25519', secretKey: seed, label: 'original' });
            const originalInternal = mgr.getPair(original.id);
            // "Export" the secret key
            const exportedSecret = originalInternal.secretKey;
            // Create a new manager and import
            const mgr2 = new KeyringManager();
            mgr2['ready'] = true;
            const reimported = mgr2.importKey({
                type: 'ed25519',
                secretKey: exportedSecret,
                label: 'reimported',
            });
            expect(reimported.address).toBe(original.address);
            expect(reimported.publicKey).toEqual(original.publicKey);
        });
        it('exports a secp256k1 keypair and reimports it', () => {
            mgr.setMnemonic(TEST_MNEMONIC);
            const original = mgr.derive({ type: 'secp256k1' });
            const originalInternal = mgr.getPair(original.id);
            const exportedSecret = originalInternal.secretKey;
            const mgr2 = new KeyringManager();
            mgr2['ready'] = true;
            const reimported = mgr2.importKey({
                type: 'secp256k1',
                secretKey: exportedSecret,
            });
            expect(reimported.address).toBe(original.address);
        });
    });
    // ── 10. Error cases ────────────────────────────────────────────────────
    describe('error cases', () => {
        it('throws if not initialised', () => {
            const uninit = new KeyringManager();
            expect(() => uninit.generateMnemonic()).toThrow('not initialised');
        });
        it('throws if derive called without mnemonic', () => {
            expect(() => mgr.derive({ type: 'ed25519' })).toThrow('No mnemonic set');
        });
        it('throws for unsupported key type on derive', () => {
            mgr.setMnemonic(TEST_MNEMONIC);
            expect(() => mgr.derive({ type: 'rsa' })).toThrow('Unsupported key type');
        });
        it('throws for unsupported key type on import', () => {
            expect(() => mgr.importKey({ type: 'rsa', secretKey: new Uint8Array(32) })).toThrow('Unsupported key type');
        });
        it('getPair returns undefined for unknown id', () => {
            expect(mgr.getPair('nonexistent')).toBeUndefined();
        });
        it('removePair returns false for unknown id', () => {
            expect(mgr.removePair('nonexistent')).toBe(false);
        });
    });
});
//# sourceMappingURL=KeyringManager.test.js.map