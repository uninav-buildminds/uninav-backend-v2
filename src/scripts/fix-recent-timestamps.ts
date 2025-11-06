/**
 * Script to fix recent entries timestamps
 * This updates all recent entries to use their createdAt as lastViewedAt if needed
 */
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import { recent } from '@app/common/modules/database/schema/recent.schema';
import { sql } from 'drizzle-orm';

dotenv.config();

async function fixRecentTimestamps() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const db = drizzle(pool);

  try {
    console.log('Starting to fix recent entries timestamps...');

    // Update all records to ensure lastViewedAt matches their actual state
    // This sets lastViewedAt to updatedAt for all entries
    const result = await db
      .update(recent)
      .set({
        lastViewedAt: sql`updated_at`,
      })
      .execute();

    console.log(`✅ Fixed timestamps for recent entries`);
    console.log(`Rows affected: ${result.rowCount}`);
  } catch (error) {
    console.error('❌ Error fixing recent timestamps:', error);
  } finally {
    await pool.end();
  }
}

fixRecentTimestamps();
