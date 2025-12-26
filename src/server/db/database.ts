import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

class Database {
  private db: sqlite3.Database | null = null;
  private dbPath: string;

  constructor(dbPath: string) {
    this.dbPath = dbPath;
  }

  async initialize(): Promise<void> {
    // Ensure data directory exists
    const dataDir = path.dirname(this.dbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          reject(err);
        } else {
          console.log(`Connected to database at ${this.dbPath}`);
          this.runMigrations()
            .then(() => resolve())
            .catch(reject);
        }
      });
    });
  }

  private async runMigrations(): Promise<void> {
    // Run main schema
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    let statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const statement of statements) {
      await this.run(statement);
    }

    console.log('Main schema migrations completed');

    // Run prompt schema
    const promptSchemaPath = path.join(__dirname, 'prompt_schema.sql');
    if (fs.existsSync(promptSchemaPath)) {
      const promptSchema = fs.readFileSync(promptSchemaPath, 'utf8');

      statements = promptSchema
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      for (const statement of statements) {
        await this.run(statement);
      }

      console.log('Prompt schema migrations completed');
    }
  }

  async run(sql: string, params: any[] = []): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async get<T>(sql: string, params: any[] = []): Promise<T | undefined> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row as T | undefined);
        }
      });
    });
  }

  async all<T>(sql: string, params: any[] = []): Promise<T[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows as T[]);
        }
      });
    });
  }

  async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve();
        return;
      }

      this.db.close((err) => {
        if (err) {
          reject(err);
        } else {
          console.log('Database connection closed');
          this.db = null;
          resolve();
        }
      });
    });
  }

  getDb(): sqlite3.Database {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return this.db;
  }
}

// Singleton instance
let dbInstance: Database | null = null;

export function getDatabase(dbPath?: string): Database {
  if (!dbInstance) {
    const path = dbPath || process.env.DATABASE_PATH || './data/courses.db';
    dbInstance = new Database(path);
  }
  return dbInstance;
}

export async function initializeDatabase(dbPath?: string): Promise<Database> {
  const db = getDatabase(dbPath);
  await db.initialize();
  return db;
}

export { Database };
