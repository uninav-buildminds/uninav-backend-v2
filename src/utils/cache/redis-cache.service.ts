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

  // Delete multiple keys matching a pattern
  async deletePattern(pattern: string): Promise<number> {
    if (!this.isConnected || !this.redisClient) {
      return 0;
    }

    try {
      const keys = await this.redisClient.keys(pattern);
      if (keys.length === 0) {
        return 0;
      }
      await this.redisClient.del(...keys);
      return keys.length;
    } catch (error) {
      this.logger.error(`Error deleting cache pattern ${pattern}:`, error);
      return 0;
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

  // Check if Redis is available
  isAvailable(): boolean {
    return this.isConnected && this.redisClient !== null;
  }
}
