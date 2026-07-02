-- Align activity_log with the canonical schema (event_id was missing on
-- some local databases created before the table was formalised).
ALTER TABLE activity_log ADD COLUMN event_id TEXT;
