import 'dotenv/config';
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { lt } from 'drizzle-orm';
import * as schema from '@app/common/modules/database/schema/schema';
import { users } from '@app/common/modules/database/schema/user.schema';

// Creates and returns a Drizzle database instance connected to PostgreSQL
const createDb = async () => {
  const isDevEnv = process.env.NODE_ENV === 'development';
  const DB_URL = isDevEnv
    ? process.env.DATABASE_URL_DEV
    : process.env.DATABASE_URL;

  if (!DB_URL) {
    throw new Error('Database URL not found in environment variables');
  }

  const pool = new Pool({
    connectionString: DB_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  const db = drizzle(pool, { schema });

  return { db, pool };
};

// Returns a Date representing the start of the current week (Monday, 00:00)
const getStartOfCurrentWeek = () => {
  const now = new Date();
  const day = now.getDay(); // 0 (Sun) - 6 (Sat)
  const diffToMonday = (day + 6) % 7; // complex: converts day to distance from Monday

  const weekStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - diffToMonday,
    0,
    0,
    0,
    0,
  );

  return weekStart;
};

// Fetches users who did not sign up in the current week and writes their emails to a text file
const exportNonWeeklySignups = async () => {
  const { db, pool } = await createDb();

  try {
    const weekStart = getStartOfCurrentWeek();

    const result = await db
      .select({
        email: users.email,
      })
      .from(users)
      .where(lt(users.createdAt, weekStart));

    const emails = result.map((row) => row.email).filter(Boolean);

    if (emails.length === 0) {
      console.log('No users found who signed up before this week.');
      return;
    }

    const dateStamp = new Date().toISOString().slice(0, 10);
    const filePath = resolve(
      process.cwd(),
      `non-weekly-signups-${dateStamp}.txt`,
    );

    const fileContents = emails.join('\n');
    await writeFile(filePath, fileContents, 'utf8');

    console.log(
      `Exported ${emails.length} email(s) to file: ${filePath}`,
    );
  } catch (error) {
    console.error('Failed to export non-weekly signups:', error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
};

// Entry point for running the export as a standalone script
exportNonWeeklySignups()
  .then(() => {
    console.log('Export process completed.');
  })
  .catch((error) => {
    console.error('Export process failed:', error);
    process.exit(1);
  });

