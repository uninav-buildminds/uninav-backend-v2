import { Injectable } from '@nestjs/common';
import { RedisCacheService } from 'src/utils/cache/redis-cache.service';
import { StructuredLoggerService } from '@app/common/modules/logger/structured-logger.service';
import { RATE_LIMIT_CONFIG, RateLimitKeys } from '../middleware/rate-limit.constants';

export interface BlacklistEntry {
  ip: string;
  reason: 'BURST' | 'VIOLATION_ESCALATION';
  bannedAt: string;
  expiresAt: string;
  durationSeconds: number;
  banLevel: 1 | 2;
}

@Injectable()
export class BlacklistService {
  constructor(
    private readonly redis: RedisCacheService,
    private readonly logger: StructuredLoggerService,
  ) {
    this.logger.setContext(BlacklistService.name);
  }

  async isBlacklisted(ip: string): Promise<boolean> {
    if (!this.redis.isAvailable()) return false;
    return this.redis.exists(RateLimitKeys.blacklist(ip));
  }

  async getBlacklistTtl(ip: string): Promise<number> {
    return this.redis.ttl(RateLimitKeys.blacklist(ip));
  }

  async blacklistForBurst(ip: string): Promise<void> {
    const duration = RATE_LIMIT_CONFIG.BURST_BAN_DURATION_SECONDS;
    const entry: BlacklistEntry = {
      ip,
      reason: 'BURST',
      bannedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + duration * 1000).toISOString(),
      durationSeconds: duration,
      banLevel: 2,
    };
    await this.redis.set(RateLimitKeys.blacklist(ip), entry, duration);
    this.logger.warn('IP blacklisted (burst/DDoS)', { ip, duration });
  }

  /**
   * Records a rate-limit violation and triggers a ban if threshold is reached.
   * Returns the ban duration applied (0 if no ban triggered yet).
   */
  async recordViolation(ip: string): Promise<number> {
    if (!this.redis.isAvailable()) return 0;

    const violationKey = RateLimitKeys.violations(ip);
    const banCountKey  = RateLimitKeys.banCount(ip);

    const violations = await this.redis.increment(
      violationKey,
      RATE_LIMIT_CONFIG.VIOLATIONS_WINDOW_SECONDS,
    );

    this.logger.debug('Violation recorded', { ip, violations });

    if (violations < RATE_LIMIT_CONFIG.VIOLATIONS_MAX_BEFORE_BAN) return 0;

    // Threshold reached — determine ban level
    const banCount = (await this.redis.get<number>(banCountKey)) ?? 0;
    const isEscalated = banCount >= RATE_LIMIT_CONFIG.BANS_MAX_BEFORE_ESCALATION;

    const banLevel: 1 | 2 = isEscalated ? 2 : 1;
    const banDuration = isEscalated
      ? RATE_LIMIT_CONFIG.BAN_DURATION_LEVEL2_SECONDS
      : RATE_LIMIT_CONFIG.BAN_DURATION_LEVEL1_SECONDS;

    const entry: BlacklistEntry = {
      ip,
      reason: 'VIOLATION_ESCALATION',
      bannedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + banDuration * 1000).toISOString(),
      durationSeconds: banDuration,
      banLevel,
    };

    await this.redis.set(RateLimitKeys.blacklist(ip), entry, banDuration);
    // Increment persistent ban count (no TTL — tracks lifetime history)
    await this.redis.set(banCountKey, banCount + 1);
    // Clear violations so the counter resets after the ban expires
    await this.redis.delete(violationKey);

    this.logger.warn('IP blacklisted (violation escalation)', {
      ip,
      banDuration,
      banLevel,
      totalBans: banCount + 1,
    });

    return banDuration;
  }

  async removeFromBlacklist(ip: string): Promise<void> {
    await this.redis.delete(RateLimitKeys.blacklist(ip));
    this.logger.log('IP manually removed from blacklist', { ip });
  }

  async getBlacklistEntry(ip: string): Promise<BlacklistEntry | null> {
    return this.redis.get<BlacklistEntry>(RateLimitKeys.blacklist(ip));
  }
}
