/**
 * @module KeyringManager
 * Manages multiple keypairs across different key types.
 * Supports derivation from mnemonic/seed and raw key import.
 */
import type { KeyPairData, KeyPairInternal, KeyType, SigningPurpose } from '../types';
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
export declare class KeyringManager {
    private pairs;
    private mnemonic;
    private _seed;
    private ready;
    private deriveCounter;
    /** SS58 prefix used for Substrate address encoding */
    ss58Prefix: number;
    /**
     * Initialise the WASM crypto backend.
     * Must be called before any key operations.
     */
    init(): Promise<void>;
    private ensureReady;
    /** Generate a new 12-word mnemonic */
    generateMnemonic(): string;
    /** Set the master mnemonic (resets derive counters) */
    setMnemonic(mnemonic: string): void;
    /** Get the current mnemonic (if set) */
    getMnemonic(): string | null;
    /**
     * Derive a new keypair from the current mnemonic/seed.
     * @throws If no mnemonic has been set
     */
    derive(options: DeriveOptions): KeyPairData;
    private deriveSubstrate;
    private deriveEthereum;
    /**
     * Import a raw secret key.
     */
    importKey(options: ImportKeyOptions): KeyPairData;
    private importEd25519;
    private importSr25519;
    private importSecp256k1;
    /** Get a keypair by id/address */
    getPair(id: string): KeyPairInternal | undefined;
    /** Get all keypairs */
    getAllPairs(): KeyPairInternal[];
    /** Get keypairs filtered by type */
    getPairsByType(type: KeyType): KeyPairInternal[];
    /** Get keypairs filtered by purpose */
    getPairsByPurpose(purpose: SigningPurpose): KeyPairInternal[];
    /** Remove a keypair by id/address */
    removePair(id: string): boolean;
    /** Remove all keypairs (does NOT clear the mnemonic) */
    clear(): void;
    /** Number of stored keypairs */
    get size(): number;
}
//# sourceMappingURL=KeyringManager.d.ts.map