import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST() {
  try {
    console.log('🔥 RECREATING CLOUD TABLES WITH EXACT MAC MINI SCHEMA');
    const db = getDb();

    // Drop all existing tables first
    const dropTables = [
      'pricing_items', 'member_deductions', 'goty_points', 'course_tees', 'courses',
      'player_event_stats', 'season_standings', 'activity_log', 'prize_allocations',
      'side_comps', 'hole_scores', 'scorecards', 'tee_times', 'rsvps', 'course_holes',
      'events', 'seasons', 'members', 'society_settings', 'societies'
    ];

    for (const table of dropTables) {
      try {
        await db.execute(`DROP TABLE IF EXISTS ${table}`);
        console.log(`✅ Dropped ${table}`);
      } catch (e) {
        console.log(`⚠️ Could not drop ${table}: ${e}`);
      }
    }

    // Recreate with exact Mac Mini schema
    const createStatements = [
      `CREATE TABLE societies (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        logo TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      )`,
      
      `CREATE TABLE society_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )`,
      
      `CREATE TABLE members (
        id TEXT PRIMARY KEY,
        society_id TEXT NOT NULL,
        name TEXT NOT NULL,
        handicap INTEGER NOT NULL,
        email TEXT,
        phone TEXT,
        member_type TEXT DEFAULT 'member',
        status TEXT DEFAULT 'active',
        joined_date TEXT DEFAULT (date('now')),
        created_at TEXT DEFAULT (datetime('now')),
        access_token TEXT UNIQUE,
        member_pin TEXT UNIQUE, 
        membership_paid INTEGER DEFAULT 0, 
        membership_paid_date TEXT, 
        membership_paid_season TEXT,
        FOREIGN KEY (society_id) REFERENCES societies(id)
      )`,
      
      `CREATE TABLE seasons (
        id TEXT PRIMARY KEY,
        society_id TEXT NOT NULL,
        name TEXT NOT NULL,
        year INTEGER NOT NULL,
        start_date TEXT,
        end_date TEXT,
        points_system TEXT DEFAULT 'f1',
        best_of_x INTEGER DEFAULT 0,
        total_events INTEGER DEFAULT 0,
        custom_points TEXT,
        bonus_config TEXT,
        status TEXT DEFAULT 'active',
        created_at TEXT DEFAULT (datetime('now'))
      )`,
      
      `CREATE TABLE events (
        id TEXT PRIMARY KEY,
        society_id TEXT NOT NULL,
        name TEXT NOT NULL,
        course_name TEXT NOT NULL,
        date TEXT NOT NULL,
        format TEXT NOT NULL,
        entry_fee REAL,
        first_tee TEXT,
        status TEXT DEFAULT 'upcoming',
        prize_config TEXT,
        season_id TEXT,
        event_number INTEGER,
        location TEXT,
        notes TEXT,
        prize_fund REAL,
        results_published INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')), 
        slope_rating INTEGER DEFAULT 113, 
        course_rating REAL DEFAULT 72, 
        course_par INTEGER DEFAULT 72, 
        handicap_allowance REAL DEFAULT 0.95, 
        course_id TEXT, 
        selected_tee_id TEXT, 
        tee_interval INTEGER DEFAULT 10, 
        club_contact_name TEXT, 
        club_contact_phone TEXT, 
        club_contact_email TEXT, 
        booking_notes TEXT, 
        deposit_amount REAL DEFAULT 0, 
        deposit_paid_by TEXT, 
        deposit_paid_date TEXT, 
        booked_by TEXT, 
        booked_date TEXT, 
        event_type TEXT DEFAULT 'standard', 
        class1_max_handicap REAL, 
        class2_min_handicap REAL, 
        ntp_winner_id TEXT, 
        ntp_hole INTEGER, 
        longest_drive_winner_id TEXT, 
        longest_drive_hole INTEGER,
        FOREIGN KEY (society_id) REFERENCES societies(id)
      )`,
      
      `CREATE TABLE course_holes (
        id TEXT PRIMARY KEY,
        event_id TEXT NOT NULL,
        hole_number INTEGER NOT NULL,
        par INTEGER NOT NULL,
        stroke_index INTEGER NOT NULL,
        yardage INTEGER NOT NULL,
        FOREIGN KEY (event_id) REFERENCES events(id)
      )`,
      
      `CREATE TABLE rsvps (
        id TEXT PRIMARY KEY,
        event_id TEXT NOT NULL,
        member_id TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now')), 
        can_enter_scores INTEGER DEFAULT 1, 
        payment_status TEXT DEFAULT 'unpaid', 
        payment_amount REAL, 
        payment_date TEXT, 
        payment_collected_by TEXT, 
        greenfee_status TEXT DEFAULT 'unpaid', 
        prize_paid INTEGER DEFAULT 0,
        FOREIGN KEY (event_id) REFERENCES events(id),
        FOREIGN KEY (member_id) REFERENCES members(id),
        UNIQUE(event_id, member_id)
      )`,
      
      `CREATE TABLE tee_times (
        id TEXT PRIMARY KEY,
        event_id TEXT NOT NULL,
        group_number INTEGER NOT NULL,
        tee_time TEXT NOT NULL,
        member_ids TEXT NOT NULL,
        FOREIGN KEY (event_id) REFERENCES events(id)
      )`,
      
      `CREATE TABLE scorecards (
        id TEXT PRIMARY KEY,
        event_id TEXT NOT NULL,
        member_id TEXT NOT NULL,
        status TEXT DEFAULT 'in_progress',
        total_gross INTEGER,
        total_points INTEGER,
        submitted_at TEXT,
        entry_method TEXT DEFAULT 'manual',
        scan_image_path TEXT, 
        front_nine_points INTEGER, 
        back_nine_points INTEGER, 
        goty_points INTEGER DEFAULT 0,
        FOREIGN KEY (event_id) REFERENCES events(id),
        FOREIGN KEY (member_id) REFERENCES members(id),
        UNIQUE(event_id, member_id)
      )`,
      
      `CREATE TABLE hole_scores (
        id TEXT PRIMARY KEY,
        scorecard_id TEXT NOT NULL,
        hole_number INTEGER NOT NULL,
        gross_score INTEGER NOT NULL,
        stableford_points INTEGER NOT NULL,
        FOREIGN KEY (scorecard_id) REFERENCES scorecards(id),
        UNIQUE(scorecard_id, hole_number)
      )`,
      
      `CREATE TABLE side_comps (
        id TEXT PRIMARY KEY,
        event_id TEXT NOT NULL,
        type TEXT NOT NULL,
        hole_number INTEGER,
        member_id TEXT NOT NULL,
        value REAL NOT NULL,
        unit TEXT,
        FOREIGN KEY (event_id) REFERENCES events(id),
        FOREIGN KEY (member_id) REFERENCES members(id)
      )`,
      
      `CREATE TABLE prize_allocations (
        id TEXT PRIMARY KEY,
        event_id TEXT NOT NULL,
        member_id TEXT NOT NULL,
        prize_type TEXT NOT NULL,
        position INTEGER,
        label TEXT NOT NULL,
        value REAL,
        countback_note TEXT,
        FOREIGN KEY (event_id) REFERENCES events(id),
        FOREIGN KEY (member_id) REFERENCES members(id)
      )`,
      
      `CREATE TABLE activity_log (
        id TEXT PRIMARY KEY,
        event_id TEXT,
        member_id TEXT,
        action TEXT NOT NULL,
        detail TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      )`,
      
      `CREATE TABLE season_standings (
        id TEXT PRIMARY KEY,
        season_id TEXT NOT NULL,
        member_id TEXT NOT NULL,
        total_points REAL DEFAULT 0,
        events_played INTEGER DEFAULT 0,
        best_finish INTEGER DEFAULT 99,
        wins INTEGER DEFAULT 0,
        top_3 INTEGER DEFAULT 0,
        avg_score REAL DEFAULT 0,
        best_score INTEGER DEFAULT 0,
        ntp_wins INTEGER DEFAULT 0,
        ld_wins INTEGER DEFAULT 0,
        position INTEGER DEFAULT 0,
        prev_position INTEGER DEFAULT 0,
        counting_events TEXT,
        UNIQUE(season_id, member_id)
      )`,
      
      `CREATE TABLE player_event_stats (
        id TEXT PRIMARY KEY,
        event_id TEXT NOT NULL,
        member_id TEXT NOT NULL,
        position INTEGER,
        points_earned REAL DEFAULT 0,
        stableford_total INTEGER DEFAULT 0,
        gross_total INTEGER DEFAULT 0,
        handicap_at_event INTEGER,
        prizes_won TEXT,
        UNIQUE(event_id, member_id)
      )`,
      
      `CREATE TABLE courses (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        location TEXT,
        website TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      )`,
      
      `CREATE TABLE course_tees (
        id TEXT PRIMARY KEY,
        course_id TEXT NOT NULL,
        tee_color TEXT NOT NULL,
        slope_rating INTEGER NOT NULL,
        course_rating REAL NOT NULL,
        par INTEGER NOT NULL,
        FOREIGN KEY (course_id) REFERENCES courses(id)
      )`,
      
      `CREATE TABLE goty_points (
        id TEXT PRIMARY KEY,
        member_id TEXT NOT NULL,
        event_id TEXT NOT NULL,
        position TEXT,
        points INTEGER NOT NULL,
        season TEXT NOT NULL,
        UNIQUE(member_id, event_id)
      )`,
      
      `CREATE TABLE member_deductions (
        id TEXT PRIMARY KEY,
        member_name TEXT NOT NULL,
        first_name TEXT,
        year INTEGER NOT NULL,
        year_starting_deduction INTEGER DEFAULT 0,
        outing_1 INTEGER DEFAULT 0,
        outing_2 INTEGER DEFAULT 0,
        outing_3 INTEGER DEFAULT 0,
        outing_4 INTEGER DEFAULT 0,
        outing_5 INTEGER DEFAULT 0,
        outing_6 INTEGER DEFAULT 0,
        outing_7 INTEGER DEFAULT 0,
        outing_8 INTEGER DEFAULT 0,
        UNIQUE(member_name, first_name, year)
      )`,
      
      `CREATE TABLE pricing_items (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        amount REAL NOT NULL,
        description TEXT,
        is_active INTEGER DEFAULT 1,
        season TEXT DEFAULT '2026',
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT
      )`
    ];

    let created = 0;
    for (const statement of createStatements) {
      try {
        await db.execute(statement);
        created++;
        console.log(`✅ Created table ${created}/${createStatements.length}`);
      } catch (error) {
        console.log(`❌ Failed to create table: ${error}`);
        throw error;
      }
    }

    console.log('🎯 SCHEMA RECREATION COMPLETE!');
    console.log(`✅ Created ${created} tables with exact Mac Mini schema`);

    return NextResponse.json({ 
      success: true, 
      message: 'Cloud tables recreated with exact Mac Mini schema',
      tables_created: created
    });
    
  } catch (error) {
    console.error('❌ Schema recreation error:', error);
    return NextResponse.json({ 
      error: 'Schema recreation failed', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}