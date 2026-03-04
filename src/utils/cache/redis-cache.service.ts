import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { ENV } from '../config/env.enum';

// Redis cache service for managing application-level caching
@Injectable()
export class RedisCacheService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisCacheService.name);
  private redisClient: Redis | null = null;
  private isConnected = false;

  constructor(private readonly configService: ConfigService) {
    this.initializeRedis();
  }

  // Initialize Redis connection
  private initializeRedis() {
    try {
      const redisUrl = this.configService.get<string>(ENV.REDIS_URL);

      if (!redisUrl) {
        this.logger.warn('Redis URL not configured. Caching will be disabled.');
        return;
      }

      this.redisClient = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        lazyConnect: false,
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
      });

      this.redisClient.on('connect', () => {
        this.isConnected = true;
        this.logger.log('Redis connected successfully');
      });

      this.redisClient.on('error', (error) => {
        this.isConnected = false;
        this.logger.error('Redis connection error:', error);
      });

      this.redisClient.on('close', () => {
        this.isConnected = false;
        this.logger.warn('Redis connection closed');
      });
    } catch (error) {
      this.logger.error('Failed to initialize Redis:', error);
      this.redisClient = null;
    }
  }

  // Get value from cache by key
  async get<T>(key: string): Promise<T | null> {
    if (!this.isConnected || !this.redisClient) {
      return null;
    }

    try {
      const value = await this.redisClient.get(key);
      if (!value) {
        return null;
      }
      return JSON.parse(value) as T;
    } catch (error) {
      this.logger.error(`Error getting cache key ${key}:`, error);
      return null;
    }
  }

  // Set value in cache with optional TTL (in seconds)
  async set(key: string, value: any, ttl?: number): Promise<boolean> {
    if (!this.isConnected || !this.redisClient) {
      return false;
    }

    try {
      const serialized = JSON.stringify(value);
      if (ttl) {
        await this.redisClient.setex(key, ttl, serialized);
      } else {
        await this.redisClient.set(key, serialized);
      }
      return true;
    } catch (error) {
      this.logger.error(`Error setting cache key ${key}:`, error);
      return false;
    }
  }

  // Delete value from cache by key
  async delete(key: string): Promise<boolean> {
    if (!this.isConnected || !this.redisClient) {
      return false;
    }

    try {
      await this.redisClient.del(key);
      return true;
    } catch (error) {
      this.logger.error(`Error deleting cache key ${key}:`, error);
      return false;
    }
  }

  // Delete multiple keys matching a pattern using SCAN to avoid blocking Redis
  async deletePattern(pattern: string): Promise<number> {
    if (!this.isConnected || !this.redisClient) {
      return 0;
    }

    try {
      let deleted = 0;
      let cursor = '0';
      do {
        const [nextCursor, keys] = await this.redisClient.scan(
          cursor,
          'MATCH',
          pattern,
          'COUNT',
          100,
        );
        cursor = nextCursor;
        if (keys.length > 0) {
          await this.redisClient.del(...keys);
          deleted += keys.length;
        }
      } while (cursor !== '0');
      return deleted;
    } catch (error) {
      this.logger.error(`Error deleting cache pattern ${pattern}:`, error);
      return 0;
    }
  }

  // Increment a user's search cache version and return the new version.
  // Used to bust per-user search caches without touching anyone else's.
  async incrementUserSearchVersion(userId: string): Promise<number> {
    if (!this.isConnected || !this.redisClient) {
      return 1;
    }
    try {
      // Key never expires — version just keeps incrementing
      const version = await this.redisClient.incr(
        `search:version:user:${userId}`,
      );
      return version;
    } catch (error) {
      this.logger.error(
        `Error incrementing search version for user ${userId}:`,
        error,
      );
      return 1;
    }
  }

  // Get current search cache version for a user (defaults to 1 if not set)
  async getUserSearchVersion(userId: string): Promise<number> {
    if (!this.isConnected || !this.redisClient) {
      return 1;
    }
    try {
      const version = await this.redisClient.get(
        `search:version:user:${userId}`,
      );
      return version ? parseInt(version, 10) : 1;
    } catch (error) {
      this.logger.error(
        `Error getting search version for user ${userId}:`,
        error,
      );
      return 1;
    }
  }

  // Check if key exists in cache
  async exists(key: string): Promise<boolean> {
    if (!this.isConnected || !this.redisClient) {
      return false;
    }

    try {
      const result = await this.redisClient.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(`Error checking cache key ${key}:`, error);
      return false;
    }
  }

  // Get remaining TTL for a key (in seconds)
  async ttl(key: string): Promise<number> {
    if (!this.isConnected || !this.redisClient) {
      return -2;
    }

    try {
      return await this.redisClient.ttl(key);
    } catch (error) {
      this.logger.error(`Error getting TTL for key ${key}:`, error);
      return -2;
    }
  }

  // Cleanup on module destroy
  async onModuleDestroy() {
    if (this.redisClient) {
      await this.redisClient.quit();
      this.logger.log('Redis connection closed');
    }
  }

  /**
   * Atomically increment a counter key and set TTL on first creation.
   * Uses INCR (atomic) + EXPIRE only when key is new (count === 1).
   * Returns the new count, or 0 on error / Redis unavailable.
   */
  async increment(key: string, initialTtl: number): Promise<number> {
    if (!this.isConnected || !this.redisClient) {
      return 0;
    }
    try {
      const count = await this.redisClient.incr(key);
      if (count === 1) {
        // First increment — set the TTL window
        await this.redisClient.expire(key, initialTtl);
      }
      return count;
    } catch (error) {
      this.logger.error(`Error incrementing key ${key}:`, error);
      return 0;
    }
  }

  // Check if Redis is available
  isAvailable(): boolean {
    return this.isConnected && this.redisClient !== null;
  }
}
