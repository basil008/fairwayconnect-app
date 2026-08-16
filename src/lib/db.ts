import { createClient } from '@libsql/client/web';
import Database from 'better-sqlite3';

let db: Database.Database | null = null;
let tursoClient: any = null;
let compatibleClient: any = null;

interface DbResult {
  rows: any[];
}

interface DbClient {
  execute(query: string | { sql: string; args?: any[] }): Promise<DbResult>;
}

function createCompatibleClient(): DbClient {
  if (!db) {
    throw new Error('Database not initialized');
  }
  const database = db;
  
  return {
    execute: async (query: string | { sql: string; args?: any[] }): Promise<DbResult> => {
      const sql = typeof query === 'string' ? query : query.sql;
      const args = typeof query === 'string' ? [] : (query.args || []);
      
      const stmt = database.prepare(sql);
      
      // Auto-detect: UPDATE/INSERT/DELETE use run(), SELECT uses all()
      const isWrite = /^\s*(UPDATE|INSERT|DELETE|CREATE|DROP|ALTER)/i.test(sql);
      
      if (isWrite) {
        const result = args.length > 0 ? stmt.run(...args) : stmt.run();
        return { rows: [] }; // Write operations return empty rows
      } else {
        const rows = args.length > 0 ? stmt.all(...args) : stmt.all();
        return { rows };
      }
    }
  };
}

export function getDb(): DbClient {
  // Check if we're on Fly.io (production) or local
  const isProduction = process.env.DATABASE_URL && process.env.DATABASE_AUTH_TOKEN;

  if (isProduction) {
    // Use Turso cloud database
    if (!tursoClient) {
      console.log('🌐 Connecting to Turso cloud database...');
      try {
        tursoClient = createClient({
          url: process.env.DATABASE_URL!,
          authToken: process.env.DATABASE_AUTH_TOKEN!
        });
        console.log('✅ Connected to Turso cloud database');
      } catch (error) {
        console.error('❌ Failed to connect to Turso:', error);
        throw error;
      }
    }
    return tursoClient;
  } else {
    // Use local SQLite database
    if (!compatibleClient) {
      if (!db) {
        const dbPath = './database/fairway-local.db';
        console.log(`🗄️ Connecting to local database: ${dbPath}`);
        
        try {
          db = new Database(dbPath);
          db.pragma('journal_mode = WAL');
          console.log('✅ Connected to local SQLite database');
        } catch (error) {
          console.error('❌ Failed to connect to database:', error);
          throw error;
        }
      }
      compatibleClient = createCompatibleClient();
    }
    return compatibleClient;
  }
}

export async function initializeDb() {
  console.log('Using exported production database - skipping initialization');
  return;
}

export async function migrateDeductions() {
  console.log('Using exported production database - skipping deduction migration');
  return;
}
