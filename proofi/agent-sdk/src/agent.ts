/**
 * ProofiAgent - Main SDK class for consuming capability tokens
 */

import {
  normalizePrivateKey,
  unwrapDEK,
  decryptBlob,
  encryptBlob,
  decodeUTF8,
  encodeUTF8,
} from './crypto';
import { DDCClient, createDDCClient } from './ddc';
import {
  parseToken,
  validateToken,
  assertNotExpired,
  assertPermission,
  hasPermission,
  getAccessiblePaths,
} from './token';
import { checkRevocation, assertNotRevoked } from './revocation';
import { ScopeError } from './errors';
import type {
  CapabilityToken,
  ProofiAgentConfig,
  ValidationResult,
  ReadOptions,
  WriteOptions,
  ListOptions,
  ListResult,
  ResourceMetadata,
  Permission,
} from './types';

/** Default DDC endpoint */
const DEFAULT_DDC_ENDPOINT = 'https://ddc.cere.network';

/**
 * ProofiAgent SDK for consuming capability tokens and accessing user data
 * 
 * @example
 * ```typescript
 * const agent = new ProofiAgent({
 *   token: capabilityToken,
 *   privateKey: agentPrivateKey,
 *   ddcEndpoint: 'https://ddc.cere.network'
 * });
 * 
 * // Validate token
 * const isValid = await agent.validateToken();
 * 
 * // Read encrypted user data (auto-decrypts)
 * const healthData = await agent.read('health/metrics');
 * 
 * // Write data back (if permitted)
 * await agent.write('health/insights', { analysis: '...' });
 * ```
 */
export class ProofiAgent {
  private readonly token: CapabilityToken;
  private readonly privateKey: Uint8Array;
  private readonly ddcClient: DDCClient;
  private dek: Uint8Array | null = null;

  constructor(config: ProofiAgentConfig) {
    // Parse token if string
    this.token =
      typeof config.token === 'string'
        ? parseToken(config.token)
        : config.token;

    // Normalize private key
    this.privateKey = normalizePrivateKey(config.privateKey);

    // Initialize DDC client
    this.ddcClient = createDDCClient({
      endpoint: config.ddcEndpoint || DEFAULT_DDC_ENDPOINT,
      timeout: config.timeout,
      bucketId: this.token.bucketId,
    });
  }

  /**
   * Get the unwrapped DEK, unwrapping if necessary
   */
  private async getDEK(): Promise<Uint8Array> {
    if (!this.dek) {
      this.dek = unwrapDEK(this.token.wrappedDEK, this.privateKey);
    }
    return this.dek;
  }

  /**
   * Validate the capability token
   * Checks expiry and optionally verifies signature
   */
  async validateToken(): Promise<ValidationResult> {
    return validateToken(this.token);
  }

  /**
   * Full validation including revocation check
   * This is the recommended validation method for production use.
   * 
   * @throws InvalidTokenError if token is revoked
   */
  async validateTokenFull(): Promise<ValidationResult> {
    // First check basic validity (expiry, structure)
    const result = validateToken(this.token);
    if (!result.valid) {
      return result;
    }
    
    // Then check revocation status
    await assertNotRevoked(this.token);
    
    return result;
  }

  /**
   * Check if token is currently valid (not expired)
   * Note: This does NOT check revocation status. Use validateTokenFull() for complete validation.
   */
  isValid(): boolean {
    const result = validateToken(this.token);
    return result.valid;
  }

  /**
   * Check revocation status of the token
   * @returns true if the token is NOT revoked (still valid)
   * @throws InvalidTokenError if the token is revoked
   */
  async checkRevocation(): Promise<boolean> {
    const status = await checkRevocation(this.token);
    return !status.revoked;
  }

  /**
   * Get time until token expires (in milliseconds)
   * Returns negative value if already expired
   */
  getExpiresIn(): number {
    const now = Date.now();
    const expiresAtMs = this.token.expiresAt * 1000;
    return expiresAtMs - now;
  }

  /**
   * Get token expiry date
   */
  getExpiresAt(): Date {
    return new Date(this.token.expiresAt * 1000);
  }

  /**
   * Get token issuer (user's DID)
   */
  getIssuer(): string {
    return this.token.issuer;
  }

  /**
   * Get token ID
   */
  getTokenId(): string {
    return this.token.id;
  }

  /**
   * Check if token grants a specific permission for a path
   */
  hasPermission(path: string, permission: Permission): boolean {
    return hasPermission(this.token, path, permission);
  }

  /**
   * Get all accessible paths for a given permission
   */
  getAccessiblePaths(permission: Permission): string[] {
    return getAccessiblePaths(this.token, permission);
  }

  /**
   * List all scopes granted by the token
   */
  listScope(): { path: string; permissions: Permission[] }[] {
    return this.token.scopes.map((scope) => ({
      path: scope.path,
      permissions: [...scope.permissions],
    }));
  }

  /**
   * Read encrypted data from DDC and decrypt it
   * 
   * @param path - Resource path to read
   * @param options - Read options
   * @returns Decrypted data (parsed JSON by default, or raw Uint8Array)
   */
  async read<T = unknown>(path: string, options: ReadOptions = {}): Promise<T> {
    // Validate token and scope
    assertNotExpired(this.token);
    assertPermission(this.token, path, 'read');

    // Get DEK
    const dek = await this.getDEK();

    // Fetch encrypted blob from DDC
    const encryptedBlob = await this.ddcClient.fetch(path);

    // Decrypt
    const decryptedData = await decryptBlob(
      { ciphertext: encryptedBlob.ciphertext, nonce: encryptedBlob.nonce },
      dek
    );

    // Return raw bytes if requested
    if (options.raw) {
      return decryptedData as unknown as T;
    }

    // Parse as JSON by default
    const jsonString = encodeUTF8(decryptedData);
    return JSON.parse(jsonString) as T;
  }

  /**
   * Read data as raw bytes
   */
  async readRaw(path: string): Promise<Uint8Array> {
    return this.read<Uint8Array>(path, { raw: true });
  }

  /**
   * Read data as text string
   */
  async readText(path: string): Promise<string> {
    const data = await this.readRaw(path);
    return encodeUTF8(data);
  }

  /**
   * Write data to DDC (encrypts automatically)
   * 
   * @param path - Resource path to write
   * @param data - Data to write (object, string, or Uint8Array)
   * @param options - Write options
   */
  async write(
    path: string,
    data: unknown,
    options: WriteOptions = {}
  ): Promise<ResourceMetadata> {
    // Validate token and scope
    assertNotExpired(this.token);
    assertPermission(this.token, path, 'write');

    // Get DEK
    const dek = await this.getDEK();

    // Serialize data
    let serialized: Uint8Array | string;
    if (data instanceof Uint8Array) {
      serialized = data;
    } else if (typeof data === 'string') {
      serialized = data;
    } else {
      serialized = JSON.stringify(data);
    }

    // Encrypt
    const encrypted = await encryptBlob(serialized, dek);

    // Store to DDC
    const contentType =
      options.contentType ||
      (data instanceof Uint8Array
        ? 'application/octet-stream'
        : typeof data === 'string'
        ? 'text/plain'
        : 'application/json');

    return this.ddcClient.store(path, {
      ciphertext: encrypted.ciphertext,
      nonce: encrypted.nonce,
      tag: '', // Tag is included in ciphertext for AES-GCM
      metadata: {
        path,
        size: serialized instanceof Uint8Array ? serialized.length : decodeUTF8(serialized).length,
        contentType,
        lastModified: Date.now(),
        checksum: '', // DDC will compute
        ...options.metadata,
      },
    });
  }

  /**
   * Delete data from DDC
   * 
   * @param path - Resource path to delete
   */
  async delete(path: string): Promise<void> {
    // Validate token and scope
    assertNotExpired(this.token);
    assertPermission(this.token, path, 'delete');

    await this.ddcClient.delete(path);
  }

  /**
   * Check if a resource exists
   */
  async exists(path: string): Promise<boolean> {
    assertNotExpired(this.token);
    assertPermission(this.token, path, 'read');

    return this.ddcClient.exists(path);
  }

  /**
   * Get metadata for a resource
   */
  async getMetadata(path: string): Promise<ResourceMetadata> {
    assertNotExpired(this.token);
    assertPermission(this.token, path, 'read');

    return this.ddcClient.getMetadata(path);
  }

  /**
   * List resources accessible to this token
   */
  async list(options: ListOptions = {}): Promise<ListResult> {
    assertNotExpired(this.token);

    // Get readable paths
    const readablePaths = this.getAccessiblePaths('read');
    if (readablePaths.length === 0) {
      return { resources: [], hasMore: false };
    }

    // Use prefix from options or first readable path
    const prefix = options.prefix || readablePaths[0].replace(/\*+$/, '');

    // Check we have permission for this prefix
    if (!this.hasPermission(prefix, 'read')) {
      throw new ScopeError(
        prefix,
        'read',
        readablePaths.map((p) => `${p} (read)`)
      );
    }

    return this.ddcClient.list({ ...options, prefix });
  }

  /**
   * Get the underlying token (for inspection)
   */
  getToken(): Readonly<CapabilityToken> {
    return Object.freeze({ ...this.token });
  }

  /**
   * Create a new ProofiAgent from a serialized config
   */
  static fromConfig(config: ProofiAgentConfig): ProofiAgent {
    return new ProofiAgent(config);
  }
}
