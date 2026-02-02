/** OTP request stored in the backend */
export interface OtpRecord {
  code: string;
  email: string;
  issuedAt: number;
  validated: boolean;
}

/** Abstract OTP store — swap implementations for dev/prod */
export interface OtpStore {
  get(email: string): Promise<OtpRecord | null>;
  set(email: string, record: OtpRecord, ttlSeconds: number): Promise<void>;
  del(email: string): Promise<void>;
}

// ── In-memory implementation (development) ──────────────────────────

export class MemoryOtpStore implements OtpStore {
  private store = new Map<string, { record: OtpRecord; expiresAt: number }>();

  async get(email: string): Promise<OtpRecord | null> {
    const entry = this.store.get(email);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(email);
      return null;
    }
    return entry.record;
  }

  async set(email: string, record: OtpRecord, ttlSeconds: number): Promise<void> {
    this.store.set(email, { record, expiresAt: Date.now() + ttlSeconds * 1000 });
  }

  async del(email: string): Promise<void> {
    this.store.delete(email);
  }
}

// ── Redis adapter interface (production) ────────────────────────────

export class RedisOtpStore implements OtpStore {
  private prefix = 'proofi:otp:';
  private client: any; // ioredis or redis client

  constructor(redisClient: any) {
    this.client = redisClient;
  }

  async get(email: string): Promise<OtpRecord | null> {
    const data = await this.client.get(this.prefix + email);
    return data ? JSON.parse(data) : null;
  }

  async set(email: string, record: OtpRecord, ttlSeconds: number): Promise<void> {
    await this.client.set(this.prefix + email, JSON.stringify(record), 'EX', ttlSeconds);
  }

  async del(email: string): Promise<void> {
    await this.client.del(this.prefix + email);
  }
}
