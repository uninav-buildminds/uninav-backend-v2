import { registerAs } from '@nestjs/config';
import { ENV } from 'src/utils/config/env.enum';
export default registerAs('config', (): { [key in ENV]: string } => ({
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL,
  DATABASE_URL_DEV: process.env.DATABASE_URL_DEV,
  PORT: process.env.PORT || '3000',
  JWT_SECRET: process.env.JWT_SECRET,

  BCRYPT_SALT_ROUNDS: process.env.BCRYPT_SALT_ROUNDS,
  BCRYPT_PEPPER: process.env.BCRYPT_PEPPER,
}));
