import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config();

export default {
  schema: './src/server/db/drizzle/schema.ts',
  out: './drizzle',
  driver: 'pg', // 'pg' for PostgreSQL, 'better-sqlite' for SQLite
  dbCredentials: {
    connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/ai_course_platform',
  },
} satisfies Config;
