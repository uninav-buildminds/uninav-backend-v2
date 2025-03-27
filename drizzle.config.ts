import 'dotenv/config';

import { Config, defineConfig } from 'drizzle-kit';
const databaseConnectionString =
  process.env.NODE_ENV === 'development'
    ? process.env.DATABASE_URL_DEV
    : process.env.DATABASE_URL;
const options: Config = {
  schema: './src/drizzle/schema/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    // Append the timeout setting to your connection string
    url: databaseConnectionString,
    ssl: true,
  },
};
export default defineConfig(options);
