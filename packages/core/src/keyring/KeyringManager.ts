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

import type { KeyPairData, KeyType, SigningPurpose } from '../types.js';

/** Options for deriving a keypair from mnemonic */
export interface DeriveOptions {
  /** Key type to derive */
  type: KeyType;
  /** BIP-44 / SURI derivation path (optional) */
  derivationPath?: string;
  /** Human-readable label */
  label?: string;
  /** Purpose tags for scoped signing */
  purposes?: SigningPurpose[];
}

/** Options for importing a raw secret key */
export interface ImportKeyOptions {
  /** Key type */
  type: KeyType;
  /** Raw secret key as hex string or Uint8Array */
  secretKey: string | Uint8Array;
  /** Human-readable label */
  label?: string;
  /** Purpose tags */
  purposes?: SigningPurpose[];
}

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
  private pairs = new Map<string, KeyPairData>();
  private mnemonic: string | null = null;
  private seed: Uint8Array | null = null;
  private ready = false;
  private deriveCounter = 0;

  /** SS58 prefix used for Substrate address encoding */
  public ss58Prefix = 42;

  /**
   * Initialise the WASM crypto backend.
   * Must be called before any key operations.
   */
  async init(): Promise<void> {
    if (this.ready) return;
    await cryptoWaitReady();
    this.ready = true;
  }

  private ensureReady(): void {
    if (!this.ready) {
      throw new Error('KeyringManager not initialised — call init() first');
    }
  }

  // ── Mnemonic / Seed ────────────────────────────────────────────────────────

  /** Generate a new 12-word mnemonic */
  generateMnemonic(): string {
    this.ensureReady();
    return mnemonicGenerate(12);
  }

  /** Set the master mnemonic (clears any existing seed) */
  setMnemonic(mnemonic: string): void {
    this.ensureReady();
    this.mnemonic = mnemonic;
    this.seed = mnemonicToMiniSecret(mnemonic);
    this.deriveCounter = 0;
  }

  /** Get the current mnemonic (if set) */
  getMnemonic(): string | null {
    return this.mnemonic;
  }

  // ── Derivation ─────────────────────────────────────────────────────────────

  /**
   * Derive a new keypair from the current mnemonic/seed.
   * @throws If no mnemonic has been set
   */
  derive(options: DeriveOptions): KeyPairData {
    this.ensureReady();

    if (!this.seed || !this.mnemonic) {
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

  private deriveSubstrate(
    type: 'ed25519' | 'sr25519',
    derivationPath?: string,
    label?: string,
    purposes?: SigningPurpose[],
  ): KeyPairData {
    const keyring = new Keyring({ type, ss58Format: this.ss58Prefix });
    const suri = derivationPath
      ? `${this.mnemonic}${derivationPath}`
      : `${this.mnemonic}//${this.deriveCounter++}`;

    const pair = keyring.addFromUri(suri);

    const data: KeyPairData = {
      id: pair.address,
      type,
      address: pair.address,
      publicKey: new Uint8Array(pair.publicKey),
      secretKey: new Uint8Array(
        // sr25519 pairs store the secret in the first 64 bytes of the keypair
        type === 'sr25519' ? pair.encodePkcs8() : pair.encodePkcs8(),
      ),
      label,
      purposes,
    };

    // Store the raw polkadot pair so we can sign with it later
    (data as any).__polkadotPair = pair;

    this.pairs.set(data.id, data);
    return data;
  }

  private deriveEthereum(
    derivationPath?: string,
    label?: string,
    purposes?: SigningPurpose[],
  ): KeyPairData {
    const path = derivationPath ?? `m/44'/60'/0'/0/${this.deriveCounter++}`;
    const hdNode = HDNodeWallet.fromPhrase(this.mnemonic!, undefined, path);

    const secretKeyBytes = hexToU8a(hdNode.privateKey);
    const publicKeyBytes = hexToU8a(hdNode.publicKey);

    const data: KeyPairData = {
      id: hdNode.address,
      type: 'secp256k1',
      address: hdNode.address,
      publicKey: publicKeyBytes,
      secretKey: secretKeyBytes,
      label,
      purposes,
    };

    // Store ethers wallet for signing
    (data as any).__ethersWallet = new EthersWallet(hdNode.privateKey);

    this.pairs.set(data.id, data);
    return data;
  }

  // ── Import ─────────────────────────────────────────────────────────────────

  /**
   * Import a raw secret key.
   */
  importKey(options: ImportKeyOptions): KeyPairData {
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

  private importEd25519(
    secretKey: Uint8Array,
    label?: string,
    purposes?: SigningPurpose[],
  ): KeyPairData {
    // tweetnacl expects 32-byte seed or 64-byte full key
    const naclPair = secretKey.length === 64
      ? { publicKey: secretKey.slice(32), secretKey }
      : nacl.sign.keyPair.fromSeed(secretKey);

    const keyring = new Keyring({ type: 'ed25519', ss58Format: this.ss58Prefix });
    const pair = keyring.addFromPair({
      publicKey: naclPair.publicKey,
      secretKey: new Uint8Array(naclPair.secretKey),
    });

    const data: KeyPairData = {
      id: pair.address,
      type: 'ed25519',
      address: pair.address,
      publicKey: new Uint8Array(naclPair.publicKey),
      secretKey: new Uint8Array(naclPair.secretKey),
      label,
      purposes,
    };

    (data as any).__polkadotPair = pair;
    this.pairs.set(data.id, data);
    return data;
  }

  private importSr25519(
    secretKey: Uint8Array,
    label?: string,
    purposes?: SigningPurpose[],
  ): KeyPairData {
    const keyring = new Keyring({ type: 'sr25519', ss58Format: this.ss58Prefix });
    // For sr25519, we need to use the mini-secret (32 bytes) via URI
    const hex = u8aToHex(secretKey);
    const pair = keyring.addFromUri(hex);

    const data: KeyPairData = {
      id: pair.address,
      type: 'sr25519',
      address: pair.address,
      publicKey: new Uint8Array(pair.publicKey),
      secretKey: secretKey,
      label,
      purposes,
    };

    (data as any).__polkadotPair = pair;
    this.pairs.set(data.id, data);
    return data;
  }

  private importSecp256k1(
    secretKey: Uint8Array,
    label?: string,
    purposes?: SigningPurpose[],
  ): KeyPairData {
    const hex = u8aToHex(secretKey);
    const wallet = new EthersWallet(hex);

    const data: KeyPairData = {
      id: wallet.address,
      type: 'secp256k1',
      address: wallet.address,
      publicKey: hexToU8a(wallet.signingKey.compressedPublicKey),
      secretKey: secretKey,
      label,
      purposes,
    };

    (data as any).__ethersWallet = wallet;
    this.pairs.set(data.id, data);
    return data;
  }

  // ── Queries ────────────────────────────────────────────────────────────────

  /** Get a keypair by id/address */
  getPair(id: string): KeyPairData | undefined {
    return this.pairs.get(id);
  }

  /** Get all keypairs */
  getAllPairs(): KeyPairData[] {
    return Array.from(this.pairs.values());
  }

  /** Get keypairs filtered by type */
  getPairsByType(type: KeyType): KeyPairData[] {
    return this.getAllPairs().filter((p) => p.type === type);
  }

  /** Get keypairs filtered by purpose */
  getPairsByPurpose(purpose: SigningPurpose): KeyPairData[] {
    return this.getAllPairs().filter((p) => p.purposes?.includes(purpose));
  }

  /** Remove a keypair by id/address */
  removePair(id: string): boolean {
    return this.pairs.delete(id);
  }

  /** Remove all keypairs (does NOT clear the mnemonic) */
  clear(): void {
    this.pairs.clear();
  }

  /** Number of stored keypairs */
  get size(): number {
    return this.pairs.size;
  }
}
