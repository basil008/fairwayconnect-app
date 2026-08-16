import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { table, data, clear } = await request.json();
    
    if (!table || !data) {
      return NextResponse.json({ error: 'Table and data required' }, { status: 400 });
    }

    const db = getDb();
    
    // Clear existing data if requested
    if (clear) {
      await db.execute(`DELETE FROM ${table}`);
      console.log(`🗑️ Cleared ${table} table`);
    }
    
    let imported = 0;
    
    for (const row of data) {
      try {
        // Build dynamic INSERT statement
        const columns = Object.keys(row);
        const placeholders = columns.map(() => '?').join(', ');
        const values = Object.values(row);
        
        const sql = `INSERT OR REPLACE INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
        
        await db.execute({ sql, args: values });
        imported++;
      } catch (error) {
        console.error(`Error importing row into ${table}:`, error);
        // Continue with next row
      }
    }
    
    console.log(`✅ Imported ${imported} records into ${table}`);
    
    return NextResponse.json({
      success: true,
      table,
      imported,
      total: data.length
    });
    
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json({ 
      error: 'Import failed', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}