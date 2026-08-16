-- Migration 019: Add DNS (Did Not Show) status tracking
-- Author: Oscar
-- Date: 2026-08-08
-- Purpose: Prevent phantom scorecards by tracking player withdrawals

-- Add DNS columns to tee_times
ALTER TABLE tee_times ADD COLUMN dns INTEGER DEFAULT 0 NOT NULL;
ALTER TABLE tee_times ADD COLUMN dns_reason TEXT;
ALTER TABLE tee_times ADD COLUMN dns_marked_at TEXT;
ALTER TABLE tee_times ADD COLUMN dns_marked_by TEXT;

-- Add DNS columns to scorecards (for cases where scorecard exists before DNS)
ALTER TABLE scorecards ADD COLUMN dns INTEGER DEFAULT 0 NOT NULL;
ALTER TABLE scorecards ADD COLUMN dns_reason TEXT;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_tee_times_dns ON tee_times(dns);
CREATE INDEX IF NOT EXISTS idx_scorecards_dns ON scorecards(dns);

-- Migration metadata
INSERT INTO migrations (name, applied_at) VALUES ('019_add_dns_status', datetime('now'));
