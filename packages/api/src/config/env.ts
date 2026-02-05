function getEnv(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

function getEnvRequired(key: string, description: string): string {
  const val = process.env[key];
  if (!val) {
    const nodeEnv = process.env.NODE_ENV ?? 'development';
    if (nodeEnv === 'production') {
      console.error(`\n🚨 FATAL: ${key} must be set in environment.`);
      console.error(`   ${description}\n`);
      process.exit(1);
    }
    // Development fallback — logged as warning
    const devFallback = `dev-${key.toLowerCase()}-CHANGE-IN-PRODUCTION`;
    console.warn(`⚠️  ${key} not set — using insecure dev fallback. DO NOT use in production.`);
    return devFallback;
  }
  return val;
}

function getEnvInt(key: string, fallback: number): number {
  const v = process.env[key];
  return v ? parseInt(v, 10) : fallback;
}

export const env = {
  NODE_ENV: getEnv('NODE_ENV', 'development'),
  PORT: getEnvInt('PORT', 3847),

  // JWT — deterministically derived from MASTER_SECRET (no separate secret needed)
  JWT_ISSUER: getEnv('JWT_ISSUER', 'https://auth.proofi.com'),
  JWT_AUDIENCE: getEnv('JWT_AUDIENCE', 'https://wallet.proofi.com'),
  JWT_EXPIRY_SECONDS: getEnvInt('JWT_EXPIRY_SECONDS', 3600),

  // OTP
  OTP_LENGTH: getEnvInt('OTP_LENGTH', 6),
  OTP_TTL_SECONDS: getEnvInt('OTP_TTL_SECONDS', 300),
  OTP_RESEND_SECONDS: getEnvInt('OTP_RESEND_SECONDS', 60),

  // SMTP (optional — falls back to console sender)
  SMTP_HOST: process.env.SMTP_HOST ?? '',
  SMTP_PORT: getEnvInt('SMTP_PORT', 587),
  SMTP_USER: process.env.SMTP_USER ?? '',
  SMTP_PASS: process.env.SMTP_PASS ?? '',
  SMTP_FROM: getEnv('SMTP_FROM', 'martijn.broersma@gmail.com'),

  // Key derivation — REQUIRED in production (crashes server if missing)
  MASTER_SECRET: getEnvRequired(
    'PROOFI_MASTER_SECRET',
    'Master secret for key derivation and HMAC-based OTP. Generate with: openssl rand -hex 32',
  ),

  // Cere wallet passphrase — REQUIRED in production
  CERE_WALLET_PASSPHRASE: getEnvRequired(
    'CERE_WALLET_PASSPHRASE',
    'Passphrase for the Cere DDC wallet JSON file.',
  ),

  // CORS — production whitelist + dev localhost
  CORS_ORIGINS: getEnv(
    'CORS_ORIGINS',
    'https://proofi-virid.vercel.app,https://proofi.ai,http://localhost:5173,http://localhost:5174,http://localhost:3000,http://localhost:8080',
  ),
  ALLOWED_ORIGINS: getEnv(
    'ALLOWED_ORIGINS',
    'https://proofi-virid.vercel.app,https://proofi.ai,http://localhost:5173,http://localhost:5174,http://localhost:3000,http://localhost:8080',
  ),
} as const;
