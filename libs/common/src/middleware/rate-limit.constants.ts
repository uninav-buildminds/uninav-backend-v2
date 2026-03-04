export const RATE_LIMIT_CONFIG = {
  // General sliding window
  GENERAL_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_GENERAL_MAX ?? '100', 10),
  GENERAL_WINDOW_SECONDS: 60,

  // Auth-specific sliding window (stricter — applied to /auth/* routes)
  AUTH_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_AUTH_MAX ?? '10', 10),
  AUTH_WINDOW_SECONDS: 60,

  // Violation escalation
  VIOLATIONS_MAX_BEFORE_BAN: 3,     // violations within the window before 1h ban
  VIOLATIONS_WINDOW_SECONDS: 600,   // 10-minute violation tracking window
  BAN_DURATION_LEVEL1_SECONDS: 3600,  // 1 hour
  BANS_MAX_BEFORE_ESCALATION: 2,    // number of level-1 bans before escalating to 24h
  BAN_DURATION_LEVEL2_SECONDS: 86400, // 24 hours

  // Burst / DDoS detection
  BURST_MAX_REQUESTS: 500,
  BURST_WINDOW_SECONDS: 10,
  BURST_BAN_DURATION_SECONDS: 86400, // 24-hour immediate ban on burst
} as const;

export const SKIP_RATE_LIMIT_KEY = 'skip_rate_limit';

export const RateLimitKeys = {
  general:    (ip: string) => `rate_limit:${ip}:general`,
  auth:       (ip: string) => `rate_limit:${ip}:auth`,
  burst:      (ip: string) => `burst:${ip}`,
  blacklist:  (ip: string) => `blacklist:${ip}`,
  violations: (ip: string) => `violations:${ip}`,
  banCount:   (ip: string) => `ban_count:${ip}`,
} as const;
