import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST() {
  try {
    console.log('🔧 FIXING TABLES - Match Mac Mini exactly');
    const db = getDb();

    // Drop and recreate events table with exact Mac Mini structure
    await db.execute('DROP TABLE IF EXISTS events');
    
    await db.execute(`
      CREATE TABLE events (
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

    // Insert the critical Hollywood Lakes event exactly as it exists on Mac Mini
    await db.execute({
      sql: `INSERT INTO events (
        id, society_id, name, course_name, date, format, entry_fee, first_tee, 
        status, prize_config, season_id, event_number, location, results_published, 
        created_at, slope_rating, course_rating, course_par, handicap_allowance,
        course_id, selected_tee_id, tee_interval, event_type, class1_max_handicap, class2_min_handicap
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        'f5394e7c-f921-4143-b6c3-192bba1ec0de',  // id
        'soc_oscar_001',                          // society_id
        'Aer Lingus Golf Society',               // name
        'Hollywood Lakes',                        // course_name
        '2026-03-27',                            // date
        'Stableford',                            // format
        40.0,                                    // entry_fee
        '10:00',                                 // first_tee
        'finalised',                             // status
        '{"prizes":[{"type":"overall","position":1,"label":"1st Overall","value":50}]}', // prize_config
        'season_2026',                           // season_id
        1,                                       // event_number
        'Hollywood Lakes',                       // location
        1,                                       // results_published
        '2026-03-26 13:34:26',                  // created_at
        123,                                     // slope_rating
        69.8,                                    // course_rating
        72,                                      // course_par
        0.95,                                    // handicap_allowance
        'course_hollywood_lakes',                // course_id
        'tee_hl_green',                         // selected_tee_id
        10,                                      // tee_interval
        'standard',                              // event_type
        18.0,                                    // class1_max_handicap
        19.0                                     // class2_min_handicap
      ]
    });

    console.log('✅ Events table recreated with exact Mac Mini structure');
    console.log('✅ Hollywood Lakes event inserted exactly from Mac Mini');

    return NextResponse.json({ 
      success: true, 
      message: 'Tables fixed - exact Mac Mini match',
      hollywood_lakes_id: 'f5394e7c-f921-4143-b6c3-192bba1ec0de'
    });
    
  } catch (error) {
    console.error('❌ Fix tables error:', error);
    return NextResponse.json({ 
      error: 'Fix tables failed', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}