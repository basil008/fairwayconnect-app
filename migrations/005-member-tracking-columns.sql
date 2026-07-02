-- Columns previously added ad hoc at runtime by API routes.
-- Formalised here as a migration (runner tolerates duplicate-column on
-- databases where the runtime ALTERs already ran).
ALTER TABLE members ADD COLUMN member_pin TEXT;
ALTER TABLE members ADD COLUMN handicap_updated_at TEXT;
ALTER TABLE members ADD COLUMN last_login_at TEXT;
ALTER TABLE members ADD COLUMN login_count INTEGER DEFAULT 0;
ALTER TABLE members ADD COLUMN first_login_at TEXT;
