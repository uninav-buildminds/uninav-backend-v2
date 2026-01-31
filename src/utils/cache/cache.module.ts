import { Module, Global } from '@nestjs/common';
import { RedisCacheService } from './redis-cache.service';

// Global cache module for Redis caching
@Global()
@Module({
  providers: [RedisCacheService],
  exports: [RedisCacheService],
})
export class CacheModule {}
