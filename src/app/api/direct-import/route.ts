import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(request: Request) {
  try {
    console.log('🔥 DIRECT MAC MINI IMPORT - Exact Table Structure');
    const db = getDb();

    // Clear all tables first
    const tablesToClear = [
      'events', 'goty_points', 'prize_allocations', 'course_holes', 
      'course_tees', 'courses', 'activity_log', 'player_event_stats',
      'season_standings', 'side_comps'
    ];
    
    for (const table of tablesToClear) {
      try {
        await db.execute(`DELETE FROM ${table}`);
        console.log(`✅ Cleared ${table}`);
      } catch (e) {
        console.log(`⚠️ ${table} doesn't exist or couldn't be cleared`);
      }
    }

    // Create events table with exact Mac Mini structure
    await db.execute(`
      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        society_id TEXT,
        name TEXT,
        course_name TEXT,
        date TEXT,
        format TEXT,
        entry_fee REAL,
        first_tee TEXT,
        status TEXT,
        prize_config TEXT,
        season_id TEXT,
        event_number INTEGER,
        location TEXT,
        notes TEXT,
        prize_fund REAL,
        results_published INTEGER,
        created_at TEXT,
        slope_rating INTEGER,
        course_rating REAL,
        course_par INTEGER,
        handicap_allowance REAL,
        course_id TEXT,
        selected_tee_id TEXT,
        tee_interval INTEGER,
        club_contact_name TEXT,
        club_contact_phone TEXT,
        club_contact_email TEXT,
        booking_notes TEXT,
        deposit_amount REAL,
        deposit_paid_by TEXT,
        deposit_paid_date TEXT,
        booked_by TEXT,
        booked_date TEXT,
        event_type TEXT,
        class1_max_handicap REAL,
        class2_min_handicap REAL,
        ntp_winner_id TEXT,
        ntp_hole INTEGER,
        longest_drive_winner_id TEXT,
        longest_drive_hole INTEGER
      )
    `);

    // Insert Hollywood Lakes event (the critical one) exactly as it exists on Mac Mini
    await db.execute({
      sql: `INSERT INTO events (
        id, society_id, name, course_name, date, format, entry_fee, first_tee, 
        status, prize_config, season_id, event_number, location, notes,
        prize_fund, results_published, created_at, slope_rating, course_rating,
        course_par, handicap_allowance, course_id, selected_tee_id, tee_interval,
        event_type, class1_max_handicap, class2_min_handicap
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        'f5394e7c-f921-4143-b6c3-192bba1ec0de',
        'soc_oscar_001',
        'Aer Lingus Golf Society',
        'Hollywood Lakes',
        '2026-03-27',
        'Stableford',
        40.0,
        '10:00',
        'finalised',
        '{"prizes":[{"type":"overall","position":1,"label":"1st Overall","value":50}]}',
        'season_2026',
        1,
        'Hollywood Lakes',
        '',
        0.0,
        1,
        '2026-03-26 13:34:26',
        123,
        69.8,
        72,
        0.95,
        'course_hollywood_lakes',
        'tee_hl_green',
        10,
        'standard',
        18.0,
        19.0
      ]
    });

    console.log('✅ Hollywood Lakes event imported exactly from Mac Mini');

    return NextResponse.json({ 
      success: true, 
      message: 'Mac Mini events structure replicated exactly' 
    });
    
  } catch (error) {
    console.error('❌ Direct import error:', error);
    return NextResponse.json({ 
      error: 'Direct import failed', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}