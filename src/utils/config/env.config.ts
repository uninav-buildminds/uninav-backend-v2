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

  B2_ACCESS_KEY: process.env.B2_ACCESS_KEY,
  B2_SECRET_KEY: process.env.B2_SECRET_KEY,
  B2_REGION: process.env.B2_REGION,
  B2_ENDPOINT: process.env.B2_ENDPOINT,
  GMAIL_CLIENT_ID: process.env.GMAIL_CLIENT_ID,
  GMAIL_CLIENT_SECRET: process.env.GMAIL_CLIENT_SECRET,
  GMAIL_REFRESH_TOKEN: process.env.GMAIL_REFRESH_TOKEN,
  COMPANY_EMAIL: process.env.COMPANY_EMAIL,
  COMPANY_NAME: process.env.COMPANY_NAME,
}));
