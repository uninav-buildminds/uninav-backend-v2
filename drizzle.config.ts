import 'dotenv/config';

import { Config, defineConfig } from 'drizzle-kit';
const databaseConnectionString =
  process.env.NODE_ENV === 'development'
    ? process.env.DATABASE_URL_DEV
    : process.env.DATABASE_URL;
const options: Config = {
  schema: './libs/common/src/modules/database/schema/schema.ts',
  out: './migrations/drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    // Append the timeout setting to your connection string
    url: databaseConnectionString,
    ssl: true,
  },
};
export default defineConfig(options);
