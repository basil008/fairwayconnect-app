-- Tables present in production but missing from older local databases.
-- Uses IF NOT EXISTS so it is safe everywhere.

CREATE TABLE IF NOT EXISTS goty_points (
        id TEXT PRIMARY KEY,
        member_id TEXT NOT NULL,
        event_id TEXT NOT NULL,
        position TEXT,
        points INTEGER NOT NULL,
        season TEXT NOT NULL,
        UNIQUE(member_id, event_id)
      );

CREATE TABLE IF NOT EXISTS player_event_stats (
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
      );

CREATE TABLE IF NOT EXISTS pricing_items (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        amount REAL NOT NULL,
        description TEXT,
        is_active INTEGER DEFAULT 1,
        season TEXT DEFAULT '2026',
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT
      );

CREATE TABLE IF NOT EXISTS season_standings (
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
      );
