import { Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response, NextFunction } from 'express';
import { RedisCacheService } from 'src/utils/cache/redis-cache.service';
import { StructuredLoggerService } from '@app/common/modules/logger/structured-logger.service';
import { BlacklistService } from '../services/blacklist.service';
import { RATE_LIMIT_CONFIG, RateLimitKeys } from './rate-limit.constants';
import { ENV } from 'src/utils/config/env.enum';

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private readonly rootApiKey: string;

  constructor(
    private readonly redis: RedisCacheService,
    private readonly blacklist: BlacklistService,
    private readonly logger: StructuredLoggerService,
    private readonly configService: ConfigService,
  ) {
    this.logger.setContext(RateLimitMiddleware.name);
    this.rootApiKey = this.configService.get<string>(ENV.ROOT_API_KEY) ?? '';
  }

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    // 1. API key bypass — checked before any Redis call
    const providedKey =
      (req.headers['x-root-api-key'] as string) ||
      (req.headers['root-api-key'] as string);

    if (providedKey && providedKey === this.rootApiKey) {
      return next();
    }

    // 2. Extract real client IP (behind Render's reverse proxy)
    const ip = this.extractIp(req);

    // 3. Blacklist check — immediate 429 if banned
    const isBlacklisted = await this.blacklist.isBlacklisted(ip);
    if (isBlacklisted) {
      const ttl = await this.blacklist.getBlacklistTtl(ip);
      return this.rejectBlacklisted(res, ttl);
    }

    // 4. Burst / DDoS detection (10-second window)
    const burstBlocked = await this.checkBurst(ip);
    if (burstBlocked) {
      return this.rejectBlacklisted(res, RATE_LIMIT_CONFIG.BURST_BAN_DURATION_SECONDS);
    }

    // 5. Sliding window rate limit
    const isAuthRoute = req.path.startsWith('/auth/');
    const { allowed, remaining, resetInSeconds } = await this.checkSlidingWindow(ip, isAuthRoute);

    const limit = isAuthRoute
      ? RATE_LIMIT_CONFIG.AUTH_MAX_REQUESTS
      : RATE_LIMIT_CONFIG.GENERAL_MAX_REQUESTS;

    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, remaining));
    res.setHeader('X-RateLimit-Reset', resetInSeconds);

    if (!allowed) {
      await this.blacklist.recordViolation(ip);
      return this.rejectRateLimit(res, resetInSeconds);
    }

    return next();
  }

  private extractIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      const raw = typeof forwarded === 'string' ? forwarded : forwarded[0];
      const first = raw.split(',')[0]?.trim();
      if (first) return first;
    }
    return req.ip ?? req.socket?.remoteAddress ?? 'unknown';
  }

  /**
   * Burst detection: if > BURST_MAX_REQUESTS within BURST_WINDOW_SECONDS, ban immediately.
   * Returns true if the request should be blocked.
   */
  private async checkBurst(ip: string): Promise<boolean> {
    if (!this.redis.isAvailable()) return false;

    const count = await this.redis.increment(
      RateLimitKeys.burst(ip),
      RATE_LIMIT_CONFIG.BURST_WINDOW_SECONDS,
    );

    if (count > RATE_LIMIT_CONFIG.BURST_MAX_REQUESTS) {
      await this.blacklist.blacklistForBurst(ip);
      await this.redis.delete(RateLimitKeys.burst(ip));
      return true;
    }

    return false;
  }

  /**
   * Fixed-window counter check. Returns whether the request is allowed,
   * how many requests remain, and when the window resets.
   */
  private async checkSlidingWindow(
    ip: string,
    isAuth: boolean,
  ): Promise<{ allowed: boolean; remaining: number; resetInSeconds: number }> {
    if (!this.redis.isAvailable()) {
      // Fail-open: allow if Redis is unavailable
      return { allowed: true, remaining: 99, resetInSeconds: 60 };
    }

    const key     = isAuth ? RateLimitKeys.auth(ip) : RateLimitKeys.general(ip);
    const maxReqs = isAuth ? RATE_LIMIT_CONFIG.AUTH_MAX_REQUESTS : RATE_LIMIT_CONFIG.GENERAL_MAX_REQUESTS;
    const window  = isAuth ? RATE_LIMIT_CONFIG.AUTH_WINDOW_SECONDS : RATE_LIMIT_CONFIG.GENERAL_WINDOW_SECONDS;

    const count = await this.redis.increment(key, window);
    const ttl   = await this.redis.ttl(key);
    const resetInSeconds = ttl > 0 ? ttl : window;

    if (count > maxReqs) {
      return { allowed: false, remaining: 0, resetInSeconds };
    }

    return { allowed: true, remaining: maxReqs - count, resetInSeconds };
  }

  private rejectBlacklisted(res: Response, retryAfter: number): void {
    res.setHeader('Retry-After', retryAfter);
    res.status(429).json({
      message: 'Your IP has been temporarily blocked due to suspicious activity.',
      status: 'ERROR',
      error: {
        cause: 'IP_BLACKLISTED',
        name: 'TooManyRequestsException',
        statusCode: 429,
      },
    });
  }

  private rejectRateLimit(res: Response, retryAfter: number): void {
    res.setHeader('Retry-After', retryAfter);
    res.status(429).json({
      message: 'Rate limit exceeded. Please slow down.',
      status: 'ERROR',
      error: {
        cause: 'RATE_LIMIT_EXCEEDED',
        name: 'TooManyRequestsException',
        statusCode: 429,
      },
    });
  }
}
