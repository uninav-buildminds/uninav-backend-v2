import { Module } from '@nestjs/common';
import { BlacklistService } from '../services/blacklist.service';
import { RateLimitMiddleware } from './rate-limit.middleware';

/**
 * Provides BlacklistService and RateLimitMiddleware.
 * Relies on CacheModule (RedisCacheService) and CommonModule (StructuredLoggerService)
 * already being registered as global modules in AppModule.
 */
@Module({
  providers: [BlacklistService, RateLimitMiddleware],
  exports: [BlacklistService, RateLimitMiddleware],
})
export class RateLimitModule {}
