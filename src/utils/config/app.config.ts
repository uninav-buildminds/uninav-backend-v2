import { configService } from 'src/utils/config/config.service';
import { HelmetOptions } from 'helmet';
import { CorsOptions } from 'cors';
import { ENV } from 'src/utils/config/env.enum';

const HELMET_OPTIONS: HelmetOptions = {
  contentSecurityPolicy: false,
};

const CORS_OPTIONS: CorsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'transaction-id'],
};

export const AppEnum = {
  PORT: configService.get(ENV.PORT) || '3000',
  NODE_ENV: configService.get(ENV.NODE_ENV) || 'development',
  CORS_OPTIONS,
  HELMET_OPTIONS,
  DATABASE_URL: configService.get(ENV.DATABASE_URL),
  // JWT_SECRET: configService.get(ENV.JWT_SECRET_KEY),
};
