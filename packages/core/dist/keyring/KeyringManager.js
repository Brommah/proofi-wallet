/**
 * @module KeyringManager
 * Manages multiple keypairs across different key types.
 * Supports derivation from mnemonic/seed and raw key import.
 */
import { Keyring } from '@polkadot/keyring';
import { mnemonicGenerate, mnemonicToMiniSecret, cryptoWaitReady } from '@polkadot/util-crypto';
import { hexToU8a, u8aToHex } from '@polkadot/util';
import { HDNodeWallet, Wallet as EthersWallet } from 'ethers';
import nacl from 'tweetnacl';
/**
 * KeyringManager holds multiple keypairs and provides derivation + import.
 *
 * @example
 * ```ts
 * const mgr = new KeyringManager();
 * await mgr.init();
 * const mnemonic = mgr.generateMnemonic();
 * mgr.setMnemonic(mnemonic);
 * const pair = mgr.derive({ type: 'ed25519', label: 'substrate-main' });
 * ```
 */
export class KeyringManager {
    pairs = new Map();
    mnemonic = null;
    _seed = null;
    ready = false;
    deriveCounter = { ed25519: 0, sr25519: 0, secp256k1: 0 };
    /** SS58 prefix used for Substrate address encoding */
    ss58Prefix = 42;
    /**
     * Initialise the WASM crypto backend.
     * Must be called before any key operations.
     */
    async init() {
        if (this.ready)
            return;
        await cryptoWaitReady();
        this.ready = true;
    }
    ensureReady() {
        if (!this.ready) {
            throw new Error('KeyringManager not initialised — call init() first');
        }
    }
    // ── Mnemonic / Seed ────────────────────────────────────────────────────────
    /** Generate a new 12-word mnemonic */
    generateMnemonic() {
        this.ensureReady();
        return mnemonicGenerate(12);
    }
    /** Set the master mnemonic (resets derive counters) */
    setMnemonic(mnemonic) {
        this.ensureReady();
        this.mnemonic = mnemonic;
        this._seed = mnemonicToMiniSecret(mnemonic);
        this.deriveCounter = { ed25519: 0, sr25519: 0, secp256k1: 0 };
    }
    /** Get the current mnemonic (if set) */
    getMnemonic() {
        return this.mnemonic;
    }
    // ── Derivation ─────────────────────────────────────────────────────────────
    /**
     * Derive a new keypair from the current mnemonic/seed.
     * @throws If no mnemonic has been set
     */
    derive(options) {
        this.ensureReady();
        if (!this._seed || !this.mnemonic) {
            throw new Error('No mnemonic set — call setMnemonic() first');
        }
        const { type, label, purposes } = options;
        switch (type) {
            case 'ed25519':
            case 'sr25519':
                return this.deriveSubstrate(type, options.derivationPath, label, purposes);
            case 'secp256k1':
                return this.deriveEthereum(options.derivationPath, label, purposes);
            default:
                throw new Error(`Unsupported key type: ${type}`);
        }
    }
    deriveSubstrate(type, derivationPath, label, purposes) {
        const keyring = new Keyring({ type, ss58Format: this.ss58Prefix });
        const suri = derivationPath
            ? `${this.mnemonic}${derivationPath}`
            : `${this.mnemonic}//${this.deriveCounter[type]++}`;
        const pair = keyring.addFromUri(suri);
        const data = {
            id: pair.address,
            type,
            address: pair.address,
            publicKey: new Uint8Array(pair.publicKey),
            secretKey: new Uint8Array(64), // placeholder — signing goes through _polkadotPair
            label,
            purposes,
            _polkadotPair: pair,
        };
        this.pairs.set(data.id, data);
        return data;
    }
    deriveEthereum(derivationPath, label, purposes) {
        const path = derivationPath ?? `m/44'/60'/0'/0/${this.deriveCounter.secp256k1++}`;
        const hdNode = HDNodeWallet.fromPhrase(this.mnemonic, undefined, path);
        const wallet = new EthersWallet(hdNode.privateKey);
        const secretKeyBytes = hexToU8a(hdNode.privateKey);
        const publicKeyBytes = hexToU8a(hdNode.publicKey);
        const data = {
            id: hdNode.address,
            type: 'secp256k1',
            address: hdNode.address,
            publicKey: publicKeyBytes,
            secretKey: secretKeyBytes,
            label,
            purposes,
            _ethersWallet: wallet,
        };
        this.pairs.set(data.id, data);
        return data;
    }
    // ── Import ─────────────────────────────────────────────────────────────────
    /**
     * Import a raw secret key.
     */
    importKey(options) {
        this.ensureReady();
        const { type, label, purposes } = options;
        const secretKey = typeof options.secretKey === 'string'
            ? hexToU8a(options.secretKey.startsWith('0x') ? options.secretKey : `0x${options.secretKey}`)
            : options.secretKey;
        switch (type) {
            case 'ed25519':
                return this.importEd25519(secretKey, label, purposes);
            case 'sr25519':
                return this.importSr25519(secretKey, label, purposes);
            case 'secp256k1':
                return this.importSecp256k1(secretKey, label, purposes);
            default:
                throw new Error(`Unsupported key type: ${type}`);
        }
    }
    importEd25519(secretKey, label, purposes) {
        // tweetnacl: 32-byte seed → full 64-byte keypair
        const naclPair = secretKey.length === 64
            ? { publicKey: secretKey.slice(32), secretKey }
            : nacl.sign.keyPair.fromSeed(secretKey);
        const keyring = new Keyring({ type: 'ed25519', ss58Format: this.ss58Prefix });
        const pair = keyring.addFromPair({
            publicKey: new Uint8Array(naclPair.publicKey),
            secretKey: new Uint8Array(naclPair.secretKey),
        });
        const data = {
            id: pair.address,
            type: 'ed25519',
            address: pair.address,
            publicKey: new Uint8Array(naclPair.publicKey),
            secretKey: new Uint8Array(naclPair.secretKey),
            label,
            purposes,
            _polkadotPair: pair,
        };
        this.pairs.set(data.id, data);
        return data;
    }
    importSr25519(secretKey, label, purposes) {
        const keyring = new Keyring({ type: 'sr25519', ss58Format: this.ss58Prefix });
        // For sr25519 we use the mini-secret (32 bytes) via a hex URI
        const hex = u8aToHex(secretKey);
        const pair = keyring.addFromUri(hex);
        const data = {
            id: pair.address,
            type: 'sr25519',
            address: pair.address,
            publicKey: new Uint8Array(pair.publicKey),
            secretKey,
            label,
            purposes,
            _polkadotPair: pair,
        };
        this.pairs.set(data.id, data);
        return data;
    }
    importSecp256k1(secretKey, label, purposes) {
        const hex = u8aToHex(secretKey);
        const wallet = new EthersWallet(hex);
        const data = {
            id: wallet.address,
            type: 'secp256k1',
            address: wallet.address,
            publicKey: hexToU8a(wallet.signingKey.compressedPublicKey),
            secretKey,
            label,
            purposes,
            _ethersWallet: wallet,
        };
        this.pairs.set(data.id, data);
        return data;
    }
    // ── Queries ────────────────────────────────────────────────────────────────
    /** Get a keypair by id/address */
    getPair(id) {
        return this.pairs.get(id);
    }
    /** Get all keypairs */
    getAllPairs() {
        return Array.from(this.pairs.values());
    }
    /** Get keypairs filtered by type */
    getPairsByType(type) {
        return this.getAllPairs().filter((p) => p.type === type);
    }
    /** Get keypairs filtered by purpose */
    getPairsByPurpose(purpose) {
        return this.getAllPairs().filter((p) => p.purposes?.includes(purpose));
    }
    /** Remove a keypair by id/address */
    removePair(id) {
        return this.pairs.delete(id);
    }
    /** Remove all keypairs (does NOT clear the mnemonic) */
    clear() {
        this.pairs.clear();
    }
    /** Number of stored keypairs */
    get size() {
        return this.pairs.size;
    }
}
//# sourceMappingURL=KeyringManager.js.map