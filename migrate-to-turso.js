#!/usr/bin/env node

/**
 * FairwayConnect Data Migration Script
 * Migrates data from local SQLite to Turso cloud database
 */

const Database = require('better-sqlite3');
const { createClient } = require('@libsql/client/web');

// Configuration
const path = require('path');
const LOCAL_DB = path.join(__dirname, 'database', 'fairway-local.db');
const TURSO_URL = 'libsql://fairwayconnect-live-oscsar.aws-eu-west-1.turso.io';
const TURSO_TOKEN = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NzY1OTkzMTksImlkIjoiMDE5ZGE1OTItMTMwMS03ZGJkLTg4MTgtOTliM2RiNDE0YTU2IiwicmlkIjoiMGJiMjgyOTMtNmRkYy00NmNmLTg1ZDgtNmRhNDE2ZGI0MzMwIn0.OgZzQ7T1o0uKrhL-S85-RLrJDYDKOi1AwcCu_A_2NGgi2pv95Qv3vqfDFScJZmgIboUt272RMyfj982bzATaCA';

// Tables to migrate in order (respecting foreign keys)
const TABLES = [
  'societies',
  'society_settings',
  'seasons',
  'members',
  'member_deductions',
  'courses',
  'course_tees',
  'events',
  'course_holes',
  'rsvps',
  'scorecards',
  'hole_scores',
  'prize_allocations',
  'side_comps'
];

async function main() {
  console.log('🚀 FairwayConnect Data Migration');
  console.log('================================\n');
  
  // Connect to local database
  console.log('📂 Connecting to local database...');
  const localDb = new Database(LOCAL_DB, { readonly: true });
  console.log('✅ Connected to local SQLite\n');
  
  // Connect to Turso
  console.log('🌐 Connecting to Turso cloud database...');
  const turso = createClient({
    url: TURSO_URL,
    authToken: TURSO_TOKEN
  });
  console.log('✅ Connected to Turso\n');
  
  let totalRows = 0;
  const stats = {};
  
  for (const table of TABLES) {
    try {
      console.log(`📊 Migrating table: ${table}`);
      
      // Get schema
      const schemaRow = localDb.prepare(
        `SELECT sql FROM sqlite_master WHERE type='table' AND name=?`
      ).get(table);
      
      if (!schemaRow) {
        console.log(`   ⚠️  Table ${table} not found, skipping\n`);
        continue;
      }
      
      // Create table in Turso
      console.log(`   Creating table schema...`);
      await turso.execute(schemaRow.sql);
      
      // Get all rows
      const rows = localDb.prepare(`SELECT * FROM ${table}`).all();
      console.log(`   Found ${rows.length} rows`);
      
      if (rows.length === 0) {
        console.log(`   ✅ Table created (empty)\n`);
        stats[table] = 0;
        continue;
      }
      
      // Get column names
      const columns = Object.keys(rows[0]);
      const placeholders = columns.map(() => '?').join(', ');
      const columnNames = columns.join(', ');
      
      // Insert rows in batches of 100
      const BATCH_SIZE = 100;
      let inserted = 0;
      
      for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const batch = rows.slice(i, i + BATCH_SIZE);
        
        for (const row of batch) {
          const values = columns.map(col => row[col]);
          const sql = `INSERT INTO ${table} (${columnNames}) VALUES (${placeholders})`;
          
          try {
            await turso.execute({
              sql,
              args: values
            });
            inserted++;
          } catch (err) {
            console.error(`   ❌ Error inserting row:`, err.message);
            console.error(`      Row data:`, JSON.stringify(row).substring(0, 200));
          }
        }
        
        process.stdout.write(`\r   Inserted ${inserted}/${rows.length} rows...`);
      }
      
      console.log(`\n   ✅ Migrated ${inserted} rows\n`);
      stats[table] = inserted;
      totalRows += inserted;
      
    } catch (error) {
      console.error(`   ❌ Error with table ${table}:`, error.message);
      console.error(`      Continuing to next table...\n`);
    }
  }
  
  // Verification
  console.log('\n🔍 Verification');
  console.log('==============\n');
  
  for (const table of Object.keys(stats)) {
    const localCount = localDb.prepare(`SELECT COUNT(*) as count FROM ${table}`).get().count;
    const tursoResult = await turso.execute(`SELECT COUNT(*) as count FROM ${table}`);
    const tursoCount = tursoResult.rows[0].count;
    
    const match = localCount === tursoCount ? '✅' : '❌';
    console.log(`${match} ${table}: Local ${localCount} | Turso ${tursoCount}`);
  }
  
  console.log('\n📈 Migration Summary');
  console.log('===================');
  console.log(`Total rows migrated: ${totalRows}`);
  console.log(`Tables migrated: ${Object.keys(stats).length}`);
  
  localDb.close();
  console.log('\n✅ Migration complete!\n');
}

main().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
