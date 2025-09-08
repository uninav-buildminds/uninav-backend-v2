import { configService } from 'src/utils/config/config.service';
import { HelmetOptions } from 'helmet';
import { ENV } from 'src/utils/config/env.enum';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

const HELMET_OPTIONS: HelmetOptions = {
  contentSecurityPolicy: false,
};

const CORS_OPTIONS: CorsOptions = {
  origin: [
    'http://localhost:3000',
    'https://uninav-buildminds.vercel.app',
    'https://uninav.live',
    'https://uninav-landing.vercel.app',
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Access-Control-Expose-Headers',
    'ROOT-API-KEY',
  ],
  credentials: true,
};

export const AppEnum = {
  PORT: configService.get(ENV.PORT) || '3000',
  NODE_ENV: configService.get(ENV.NODE_ENV) || 'development',
  CORS_OPTIONS,
  HELMET_OPTIONS,
  DATABASE_URL: configService.get(ENV.DATABASE_URL),
  // JWT_SECRET: configService.get(ENV.JWT_SECRET_KEY),
};
