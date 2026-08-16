import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { table, data } = body;
    
    console.log(`📥 Importing ${table} with ${data?.length || 0} records...`);
    const db = getDb();

    // Create missing tables
    if (table === 'goty_points') {
      await db.execute(`
        CREATE TABLE IF NOT EXISTS goty_points (
          id TEXT PRIMARY KEY,
          member_id TEXT,
          event_id TEXT,
          position TEXT,
          points INTEGER,
          season TEXT
        )
      `);
      await db.execute('DELETE FROM goty_points');
      
      for (const row of data || []) {
        await db.execute({
          sql: 'INSERT INTO goty_points (id, member_id, event_id, position, points, season) VALUES (?, ?, ?, ?, ?, ?)',
          args: [row.id, row.member_id, row.event_id, row.position, row.points, row.season]
        });
      }
    }
    
    else if (table === 'prize_allocations') {
      await db.execute(`
        CREATE TABLE IF NOT EXISTS prize_allocations (
          id TEXT PRIMARY KEY,
          event_id TEXT,
          member_id TEXT,
          prize_type TEXT,
          position INTEGER,
          label TEXT,
          value REAL,
          countback_note TEXT
        )
      `);
      await db.execute('DELETE FROM prize_allocations');
      
      for (const row of data || []) {
        await db.execute({
          sql: 'INSERT INTO prize_allocations (id, event_id, member_id, prize_type, position, label, value, countback_note) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          args: [row.id, row.event_id, row.member_id, row.prize_type, row.position, row.label, row.value, row.countback_note]
        });
      }
    }
    
    else if (table === 'course_holes') {
      await db.execute(`
        CREATE TABLE IF NOT EXISTS course_holes (
          id TEXT PRIMARY KEY,
          event_id TEXT,
          hole_number INTEGER,
          par INTEGER,
          stroke_index INTEGER,
          distance_metres INTEGER
        )
      `);
      await db.execute('DELETE FROM course_holes');
      
      for (const row of data || []) {
        await db.execute({
          sql: 'INSERT INTO course_holes (id, event_id, hole_number, par, stroke_index, distance_metres) VALUES (?, ?, ?, ?, ?, ?)',
          args: [row.id, row.event_id, row.hole_number, row.par, row.stroke_index, row.distance_metres]
        });
      }
    }

    console.log(`✅ Imported ${data?.length || 0} records into ${table}`);
    return NextResponse.json({ success: true, imported: data?.length || 0 });
    
  } catch (error) {
    console.error('❌ Import error:', error);
    return NextResponse.json({ 
      error: 'Import failed', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}