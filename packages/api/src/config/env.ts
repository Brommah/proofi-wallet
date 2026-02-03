function getEnv(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

function getEnvInt(key: string, fallback: number): number {
  const v = process.env[key];
  return v ? parseInt(v, 10) : fallback;
}

export const env = {
  NODE_ENV: getEnv('NODE_ENV', 'development'),
  PORT: getEnvInt('PORT', 3847),

  // JWT
  JWT_SECRET: getEnv('PROOFI_JWT_SECRET', 'dev-secret-change-me'),
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

  // Key derivation
  MASTER_SECRET: getEnv('PROOFI_MASTER_SECRET', 'dev-master-secret-change-in-production'),

  // CORS
  CORS_ORIGINS: getEnv('CORS_ORIGINS', 'http://localhost:5173,http://localhost:5174,http://localhost:3000,http://localhost:8080'),
  ALLOWED_ORIGINS: getEnv('ALLOWED_ORIGINS', 'http://localhost:5173,http://localhost:5174,http://localhost:3000,http://localhost:8080'),
} as const;
