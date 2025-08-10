import { Logger, Module } from '@nestjs/common';
import { DrizzleService } from './drizzle.service';

import { ConfigModule, ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema/schema';
import { DrizzleDB } from 'src/utils/types/db.types';
import { DRIZZLE_SYMBOL } from 'src/utils/config/constants.config';
import { ENV } from 'src/utils/config/env.enum';
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: DRIZZLE_SYMBOL,
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const isDevEnv = configService.get(ENV.NODE_ENV) === 'development';
        const DB_URL = isDevEnv
          ? configService.get(ENV.DATABASE_URL_DEV)
          : configService.get(ENV.DATABASE_URL);
        const pool = new Pool({
          connectionString: DB_URL,
          // ssl: {
          //   rejectUnauthorized: false,
          // },
          connectionTimeoutMillis: 30000,
          idleTimeoutMillis: 30000,
          max: 10,
          allowExitOnIdle: false,
        });
        pool.on('error', async (error: any) => {
          if (error.code === '57P01') {
            logger.warn('Reconnecting ...');
            await pool.connect();
          }
          logger.error(error.message, error.stack);
        });

        try {
          await pool.connect();
          logger.log('Connected to database Successfully 😃');
        } catch (error) {
          logger.error('Failed to connect to database:');
          logger.error(error.message);
          console.log(error);
        }

        return drizzle(pool, { schema }) as DrizzleDB;
      },
    },
    DrizzleService,
  ],
  exports: [DRIZZLE_SYMBOL],
})
export class DrizzleModule {}

export const logger = new Logger(DrizzleModule.name);
