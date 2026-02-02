/** Environment configuration with defaults for development */
export const env = {
  get PORT() { return +(process.env.PORT || '3100'); },
  get NODE_ENV() { return process.env.NODE_ENV || 'development'; },
  get JWT_AUDIENCE() { return process.env.JWT_AUDIENCE || 'proofi.id'; },
  get JWT_EXPIRY() { return process.env.JWT_EXPIRY || '1h'; },
  get JWT_REFRESH_EXPIRY() { return process.env.JWT_REFRESH_EXPIRY || '7d'; },
  get OTP_LENGTH() { return +(process.env.OTP_LENGTH || '6'); },
  get OTP_TTL_SECONDS() { return +(process.env.OTP_TTL_SECONDS || '300'); },
  get OTP_RESEND_SECONDS() { return +(process.env.OTP_RESEND_SECONDS || '60'); },
  get SMTP_HOST() { return process.env.SMTP_HOST || ''; },
  get SMTP_PORT() { return +(process.env.SMTP_PORT || '587'); },
  get SMTP_USER() { return process.env.SMTP_USER || ''; },
  get SMTP_PASS() { return process.env.SMTP_PASS || ''; },
  get SMTP_FROM() { return process.env.SMTP_FROM || 'noreply@proofi.id'; },
  get RESEND_API_KEY() { return process.env.RESEND_API_KEY || ''; },
  get REDIS_URL() { return process.env.REDIS_URL || ''; },
  // Web3Auth (optional)
  get WEB3AUTH_VERIFIER() { return process.env.WEB3AUTH_VERIFIER || ''; },
  get WEB3AUTH_NETWORK() { return process.env.WEB3AUTH_NETWORK || 'sapphire_mainnet'; },
  get WEB3AUTH_CLIENT_ID() { return process.env.WEB3AUTH_CLIENT_ID || ''; },
} as const;
