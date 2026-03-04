/**
 * Migrates existing club `interests` arrays in the DB from old labels to new ones.
 *
 * Usage:
 *   NODE_ENV=development pnpm run migrate:club-interests
 *   NODE_ENV=production  pnpm run migrate:club-interests
 *
 * The script is idempotent — running it multiple times is safe.
 */
import 'dotenv/config';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { clubs } from '../../libs/common/src/modules/database/schema/clubs.schema';

// ---------------------------------------------------------------------------
// Migration map — old label → new label
// ---------------------------------------------------------------------------
const INTEREST_MIGRATION_MAP: Record<string, string> = {
  'Coding': 'Technology & Computing',
  'Design': 'Art & Illustration',
  'AI & Machine Learning': 'AI & Data Science',
  'Robotics': 'Engineering',
  'Data Science': 'AI & Data Science',
  'Web Development': 'Technology & Computing',
  'Mobile Development': 'Technology & Computing',
  'Cloud Computing': 'Technology & Computing',
  'Entrepreneurship': 'Entrepreneurship',
  'Finance & Investing': 'Finance & Investing',
  'Marketing': 'Marketing & PR',
  'Business Strategy': 'Business Strategy',
  'Music': 'Music',
  'Film & Photography': 'Film & Cinema',
  'Art & Illustration': 'Art & Illustration',
  'Creative Writing': 'Creative Writing',
  'Debate & Public Speaking': 'Debate & Public Speaking',
  'Model UN': 'Model UN & Diplomacy',
  'Sports & Fitness': 'Sports & Fitness',
  'Dance': 'Dance',
  'Volunteering': 'Volunteering & Community Service',
  'Environmental & Sustainability': 'Environmental & Sustainability',
  'Health & Wellness': 'Health & Wellness',
  'Fashion': 'Fashion',
  'Cooking & Culinary': 'Cooking & Culinary',
  'Reading & Book Club': 'Reading & Book Club',
  'Languages & Culture': 'Languages & Culture',
  'Science & Research': 'Science & Research',
  'Mathematics': 'Mathematics',
  'Engineering': 'Engineering',
  'Law & Policy': 'Law & Policy',
  'Religion & Spirituality': 'Religion & Spirituality',
  'Social Impact': 'Social Impact & Advocacy',
  'Networking': 'Networking & Professional Dev',
  // Cybersecurity stays as-is (already matches new list)
  'Cybersecurity': 'Cybersecurity',
  // Game Development stays as-is
  'Game Development': 'Game Development',
};

function migrateInterests(interests: string[] | null): string[] {
  if (!interests) return [];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const old of interests) {
    const mapped = INTEREST_MIGRATION_MAP[old] ?? old;
    if (!seen.has(mapped)) {
      seen.add(mapped);
      result.push(mapped);
    }
  }
  return result;
}

async function main() {
  const isDevEnv = process.env.NODE_ENV !== 'production';
  const DB_URL = isDevEnv
    ? process.env.DATABASE_URL_DEV
    : process.env.DATABASE_URL;

  if (!DB_URL) {
    console.error('❌  Database URL not found. Set DATABASE_URL_DEV or DATABASE_URL.');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });
  await pool.connect();
  console.log('✅  Connected to database');

  const db = drizzle(pool, {
    schema: { clubs },
  });

  const allClubs = await db.select({ id: clubs.id, interests: clubs.interests }).from(clubs);
  console.log(`📋  Found ${allClubs.length} clubs to inspect`);

  let updated = 0;
  let skipped = 0;

  for (const club of allClubs) {
    const original = club.interests ?? [];
    const migrated = migrateInterests(original);

    const changed =
      original.length !== migrated.length ||
      original.some((v, i) => v !== migrated[i]);

    if (!changed) {
      skipped++;
      continue;
    }

    await db
      .update(clubs)
      .set({ interests: migrated } as any)
      .where(
        // Using raw SQL via the drizzle helper to avoid importing eq separately
        (await import('drizzle-orm')).eq(clubs.id, club.id),
      );

    console.log(`  ✏️  ${club.id}: [${original.join(', ')}] → [${migrated.join(', ')}]`);
    updated++;
  }

  console.log(`\n🎉  Done. Updated: ${updated}, Skipped (already up-to-date): ${skipped}`);
  await pool.end();
}

main().catch((err) => {
  console.error('❌  Migration failed:', err);
  process.exit(1);
});
