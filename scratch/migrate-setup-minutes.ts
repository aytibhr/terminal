import { db } from '../lib/db/drizzle';
import { sql } from 'drizzle-orm';

async function run() {
  console.log('Starting migration to add setup_minutes to sessions...');
  try {
    await db.execute(sql`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS setup_minutes INTEGER NOT NULL DEFAULT 0`);
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  }
  process.exit(0);
}

run();
