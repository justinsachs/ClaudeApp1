/**
 * Database Migration Script
 * Run this to apply migrations to the database
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

async function runMigrations() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  console.log('Running migrations...');

  const migrationClient = postgres(databaseUrl, { max: 1 });
  const db = drizzle(migrationClient);

  try {
    const migrationsFolder = process.env.MIGRATIONS_FOLDER || './drizzle';
    console.log(`Using migrations folder: ${migrationsFolder}`);
    await migrate(db, { migrationsFolder });
    console.log('Migrations completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }

  await migrationClient.end();
  process.exit(0);
}

runMigrations();
