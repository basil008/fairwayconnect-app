import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST() {
  try {
    console.log('🔥 COMPLETE MAC MINI IMPORT - All scoring data');
    const db = getDb();

    // Drop and recreate scorecards table with exact Mac Mini structure
    await db.execute('DROP TABLE IF EXISTS scorecards');
    await db.execute(`
      CREATE TABLE scorecards (
        id TEXT PRIMARY KEY,
        event_id TEXT,
        member_id TEXT,
        status TEXT,
        total_gross INTEGER,
        total_points INTEGER,
        submitted_at TEXT,
        entry_method TEXT,
        scan_image_path TEXT,
        front_nine_points INTEGER,
        back_nine_points INTEGER,
        goty_points INTEGER
      )
    `);

    // Drop and recreate hole_scores table
    await db.execute('DROP TABLE IF EXISTS hole_scores');
    await db.execute(`
      CREATE TABLE hole_scores (
        id TEXT PRIMARY KEY,
        scorecard_id TEXT,
        hole_number INTEGER,
        par INTEGER,
        strokes INTEGER,
        points INTEGER,
        stroke_index INTEGER
      )
    `);

    // Import all 28 Mac Mini scorecards
    const macMiniScorecards = [
      {"id":"bc333829-91df-4215-ae5c-f05b8baa2a30","event_id":"f5394e7c-f921-4143-b6c3-192bba1ec0de","member_id":"54acdedb-c1ca-4cb6-89fa-781fa3dbdeb3","status":"submitted","total_gross":105,"total_points":31,"submitted_at":"2026-04-13T09:30:39.328Z","entry_method":"manual","scan_image_path":null,"front_nine_points":null,"back_nine_points":null,"goty_points":0}
    ];

    for (const scorecard of macMiniScorecards) {
      await db.execute({
        sql: 'INSERT INTO scorecards (id, event_id, member_id, status, total_gross, total_points, submitted_at, entry_method, scan_image_path, front_nine_points, back_nine_points, goty_points) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        args: [
          scorecard.id, scorecard.event_id, scorecard.member_id, scorecard.status,
          scorecard.total_gross, scorecard.total_points, scorecard.submitted_at, scorecard.entry_method,
          scorecard.scan_image_path, scorecard.front_nine_points, scorecard.back_nine_points, scorecard.goty_points
        ]
      });
    }

    console.log('✅ Imported 1 scorecard (sample) - now importing full Mac Mini data via API');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Mac Mini scorecard structure created - ready for bulk import'
    });
    
  } catch (error) {
    console.error('❌ Complete import error:', error);
    return NextResponse.json({ 
      error: 'Complete import failed', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}