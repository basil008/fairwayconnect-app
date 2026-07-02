-- Add Captain's Prize fields to events table
ALTER TABLE events ADD COLUMN event_type TEXT DEFAULT 'standard';
ALTER TABLE events ADD COLUMN class1_max_handicap REAL DEFAULT 18.0;
ALTER TABLE events ADD COLUMN class2_min_handicap REAL DEFAULT 19.0;

-- Update existing events to 'standard' type
UPDATE events SET event_type = 'standard' WHERE event_type IS NULL;
