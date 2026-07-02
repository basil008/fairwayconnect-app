/**
 * Migration runner — the single source of truth for schema changes.
 *
 * - Applies migrations/NNN-*.sql in numeric order
 * - Records applied files in schema_migrations
 * - Tolerates "duplicate column" errors so baseline migrations can be
 *   applied safely to databases that already have some of the changes
 *   (this codebase previously mutated schema ad hoc at runtime).
 *
 * Usage:
 *   npm run migrate                     # local DB
 *   DATABASE_URL=... DATABASE_AUTH_TOKEN=... npm run migrate   # Turso
 */
import { getDb } from '../src/lib/db';
import fs from 'fs';
import path from 'path';

const MIGRATIONS_DIR = path.join(__dirname, '..', 'migrations');

function splitStatements(sql: string): string[] {
  return sql
    .split(/;\s*(?:\n|$)/)
    .map(chunk =>
      // Remove full-line comments, keep the actual statement
      chunk
        .split('\n')
        .filter(line => !line.trim().startsWith('--'))
        .join('\n')
        .trim()
    )
    .filter(s => s.length > 0);
}

async function main() {
  const db = getDb();

  await db.execute(`CREATE TABLE IF NOT EXISTS schema_migrations (
    filename TEXT PRIMARY KEY,
    applied_at TEXT NOT NULL
  )`);

  const applied = new Set(
    (await db.execute('SELECT filename FROM schema_migrations')).rows.map(
      r => r.filename as string
    )
  );

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter(f => /^\d{3}-.*\.sql$/.test(f))
    .sort();

  let ran = 0;
  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf-8');
    console.log(`▶ Applying ${file}`);
    for (const stmt of splitStatements(sql)) {
      try {
        await db.execute(stmt);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (/duplicate column|already exists/i.test(msg)) {
          console.log(`  ↷ skipped (already applied): ${stmt.slice(0, 60)}...`);
          continue;
        }
        console.error(`  ✖ FAILED: ${stmt.slice(0, 100)}`);
        throw e;
      }
    }
    await db.execute({
      sql: 'INSERT INTO schema_migrations (filename, applied_at) VALUES (?, ?)',
      args: [file, new Date().toISOString()],
    });
    ran++;
    console.log(`  ✔ ${file} applied`);
  }

  console.log(ran === 0 ? '✅ Database is up to date' : `✅ Applied ${ran} migration(s)`);
}

main().catch(e => {
  console.error('Migration failed:', e);
  process.exit(1);
});
