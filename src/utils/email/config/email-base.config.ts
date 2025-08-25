import { config } from 'dotenv';
config();

// Base configuration for all email templates
export const EmailBaseConfig = {
  companyName: process.env.COMPANY_NAME || 'UniNav',
  companyEmail: process.env.COMPANY_EMAIL || 'support@uninav.com',
  supportEmail: process.env.COMPANY_EMAIL || 'support@uninav.com',
  websiteUrl: process.env.FRONTEND_URL || 'https://uninav.com',
  currentYear: new Date().getFullYear(),
};
