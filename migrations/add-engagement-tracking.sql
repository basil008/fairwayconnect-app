-- Engagement Tracking Migration
-- Date: 3 May 2026
-- Purpose: Track member engagement and RSVP sources

-- Add RSVP source tracking
ALTER TABLE rsvps ADD COLUMN created_by TEXT;
-- Values: 'member' (self-service) or 'admin' (manual)

ALTER TABLE rsvps ADD COLUMN created_by_admin_name TEXT;
-- Which admin created it (if admin-created)

-- Add member login tracking
ALTER TABLE members ADD COLUMN last_login_at TEXT;
-- Timestamp of most recent login

ALTER TABLE members ADD COLUMN login_count INTEGER DEFAULT 0;
-- Total number of times member has logged in

ALTER TABLE members ADD COLUMN first_login_at TEXT;
-- When member first used the app (adoption tracking)

-- Backfill existing RSVPs as admin-created (conservative assumption)
UPDATE rsvps SET created_by = 'admin' WHERE created_by IS NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_members_last_login ON members(last_login_at);
CREATE INDEX IF NOT EXISTS idx_rsvps_created_by ON rsvps(created_by);
