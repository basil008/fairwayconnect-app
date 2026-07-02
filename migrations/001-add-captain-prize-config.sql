-- Captain's Prize Configuration Table
CREATE TABLE IF NOT EXISTS captain_prize_config (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL,
  
  -- Overall Prizes
  first_overall_amount REAL DEFAULT 80,
  second_overall_amount REAL DEFAULT 60,
  third_overall_amount REAL DEFAULT 40,
  
  -- Class 1 Configuration
  class1_enabled INTEGER DEFAULT 1,
  class1_name TEXT DEFAULT 'Class 1',
  class1_handicap_min REAL DEFAULT 0,
  class1_handicap_max REAL DEFAULT 18,
  class1_first_amount REAL DEFAULT 40,
  class1_second_amount REAL DEFAULT 30,
  
  -- Class 2 Configuration
  class2_enabled INTEGER DEFAULT 1,
  class2_name TEXT DEFAULT 'Class 2',
  class2_handicap_min REAL DEFAULT 19,
  class2_handicap_max REAL DEFAULT 54,
  class2_first_amount REAL DEFAULT 40,
  class2_second_amount REAL DEFAULT 30,
  
  -- Front/Back 9
  front9_amount REAL DEFAULT 25,
  back9_amount REAL DEFAULT 25,
  
  -- Side Competitions
  longest_drive_amount REAL DEFAULT 20,
  nearest_pin_amount REAL DEFAULT 20,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_captain_prize_event ON captain_prize_config(event_id);
