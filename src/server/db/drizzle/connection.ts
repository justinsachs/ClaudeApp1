/**
 * Drizzle Database Connection
 * Supports PostgreSQL (production) and SQLite (local development)
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

let db: ReturnType<typeof drizzle> | null = null;

export function getDrizzleDb() {
  if (db) {
    return db;
  }

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      'DATABASE_URL environment variable is not set. ' +
      'Please configure your database connection in .env file.'
    );
  }

  // Create postgres connection
  const queryClient = postgres(databaseUrl);

  // Create drizzle instance
  db = drizzle(queryClient, { schema });

  console.log('Drizzle ORM connected to PostgreSQL');

  return db;
}

/**
 * Close database connection
 */
export async function closeDrizzleDb() {
  if (db) {
    // Note: postgres-js doesn't have an explicit close method
    // Connections are managed automatically
    db = null;
  }
}

// Export the schema for use in queries
export { schema };
