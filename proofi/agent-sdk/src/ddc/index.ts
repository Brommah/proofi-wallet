/**
 * DDC (Decentralized Data Cloud) client for Cere Network
 */

import { DDCError, ResourceNotFoundError } from '../errors';
import type { EncryptedBlob, ResourceMetadata, ListOptions, ListResult } from '../types';

/** Default DDC endpoint */
const DEFAULT_DDC_ENDPOINT = 'https://ddc.cere.network';

/** Default request timeout */
const DEFAULT_TIMEOUT = 30000;

/** DDC client configuration */
export interface DDCClientConfig {
  /** DDC API endpoint */
  endpoint: string;
  /** Request timeout in milliseconds */
  timeout: number;
  /** Bucket ID for data access */
  bucketId: string;
  /** Authentication token for DDC API */
  authToken?: string;
}

/**
 * Client for interacting with Cere DDC
 */
export class DDCClient {
  private readonly endpoint: string;
  private readonly timeout: number;
  private readonly bucketId: string;
  private readonly authToken?: string;

  constructor(config: Partial<DDCClientConfig> & { bucketId: string }) {
    this.endpoint = (config.endpoint || DEFAULT_DDC_ENDPOINT).replace(/\/+$/, '');
    this.timeout = config.timeout || DEFAULT_TIMEOUT;
    this.bucketId = config.bucketId;
    this.authToken = config.authToken;
  }

  /**
   * Build URL for a resource path
   */
  private buildUrl(path: string): string {
    const normalizedPath = path.replace(/^\/+/, '');
    return `${this.endpoint}/api/v1/buckets/${this.bucketId}/files/${normalizedPath}`;
  }

  /**
   * Build headers for requests
   */
  private buildHeaders(additionalHeaders?: Record<string, string>): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...additionalHeaders,
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    return headers;
  }

  /**
   * Make HTTP request with timeout
   */
  private async request<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: this.buildHeaders(options.headers as Record<string, string>),
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new ResourceNotFoundError(url, this.endpoint);
        }
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new DDCError(this.endpoint, errorText, response.status);
      }

      return response.json() as Promise<T>;
    } catch (error) {
      if (error instanceof DDCError) {
        throw error;
      }
      if (error instanceof Error && error.name === 'AbortError') {
        throw new DDCError(this.endpoint, 'Request timeout');
      }
      throw new DDCError(
        this.endpoint,
        error instanceof Error ? error.message : 'Unknown error'
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Fetch encrypted data from DDC
   */
  async fetch(path: string): Promise<EncryptedBlob> {
    const url = this.buildUrl(path);
    return this.request<EncryptedBlob>(url, { method: 'GET' });
  }

  /**
   * Store encrypted data to DDC
   */
  async store(path: string, blob: EncryptedBlob): Promise<ResourceMetadata> {
    const url = this.buildUrl(path);
    return this.request<ResourceMetadata>(url, {
      method: 'PUT',
      body: JSON.stringify(blob),
    });
  }

  /**
   * Delete data from DDC
   */
  async delete(path: string): Promise<void> {
    const url = this.buildUrl(path);
    await this.request<void>(url, { method: 'DELETE' });
  }

  /**
   * Check if a resource exists
   */
  async exists(path: string): Promise<boolean> {
    const url = this.buildUrl(path);
    try {
      await this.request<ResourceMetadata>(url, { method: 'HEAD' });
      return true;
    } catch (error) {
      if (error instanceof ResourceNotFoundError) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Get metadata for a resource
   */
  async getMetadata(path: string): Promise<ResourceMetadata> {
    const url = `${this.buildUrl(path)}?metadata=true`;
    return this.request<ResourceMetadata>(url, { method: 'GET' });
  }

  /**
   * List resources in a path
   */
  async list(options: ListOptions = {}): Promise<ListResult> {
    const params = new URLSearchParams();
    if (options.prefix) params.set('prefix', options.prefix);
    if (options.limit) params.set('limit', options.limit.toString());
    if (options.cursor) params.set('cursor', options.cursor);

    const url = `${this.endpoint}/api/v1/buckets/${this.bucketId}/files?${params}`;
    return this.request<ListResult>(url, { method: 'GET' });
  }

  /**
   * Get bucket information
   */
  async getBucketInfo(): Promise<{
    id: string;
    owner: string;
    size: number;
    fileCount: number;
  }> {
    const url = `${this.endpoint}/api/v1/buckets/${this.bucketId}`;
    return this.request(url, { method: 'GET' });
  }
}

/**
 * Create a DDC client instance
 */
export function createDDCClient(config: Partial<DDCClientConfig> & { bucketId: string }): DDCClient {
  return new DDCClient(config);
}
