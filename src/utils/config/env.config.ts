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

  IDRIVE_ACCESS_KEY: process.env.IDRIVE_ACCESS_KEY,
  IDRIVE_SECRET_KEY: process.env.IDRIVE_SECRET_KEY,
  IDRIVE_REGION: process.env.IDRIVE_REGION,
  IDRIVE_ENDPOINT: process.env.IDRIVE_ENDPOINT,
  IDRIVE_PRIVATE_BUCKET: process.env.IDRIVE_PRIVATE_BUCKET,
  IDRIVE_PUBLIC_BUCKET: process.env.IDRIVE_PUBLIC_BUCKET,
  GMAIL_CLIENT_ID: process.env.GMAIL_CLIENT_ID,
  GMAIL_CLIENT_SECRET: process.env.GMAIL_CLIENT_SECRET,
  GMAIL_REFRESH_TOKEN: process.env.GMAIL_REFRESH_TOKEN,
  COMPANY_EMAIL: process.env.COMPANY_EMAIL,
  COMPANY_NAME: process.env.COMPANY_NAME,

  CRYPTO_KEY: process.env.CRYPTO_KEY,
  CRYPTO_IV: process.env.CRYPTO_IV,
  CRYPTO_ENCRYPTION_ALGORITHM:
    process.env.CRYPTO_ENCRYPTION_ALGORITHM || 'aes-256-cbc',

  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  ROOT_API_KEY: process.env.ROOT_API_KEY,

  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI,
  BREVO_API_KEY: process.env.BREVO_API_KEY,
  BREVO_SENDER_EMAIL: process.env.BREVO_SENDER_EMAIL,
  MAILSEND_API_KEY: process.env.MAILSEND_API_KEY,
  MAILSEND_SENDER_EMAIL: process.env.MAILSEND_SENDER_EMAIL,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  RESEND_SENDER_EMAIL: process.env.RESEND_SENDER_EMAIL,
}));
