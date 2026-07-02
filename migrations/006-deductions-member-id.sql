-- Deductions were matched by name strings (fragile: duplicate surnames,
-- renames, whitespace). Add a proper foreign key and backfill it by the
-- old name-matching rule ONCE; code now joins on member_id.
ALTER TABLE member_deductions ADD COLUMN member_id TEXT;

UPDATE member_deductions
SET member_id = (
  SELECT m.id FROM members m
  WHERE lower(trim(COALESCE(member_deductions.first_name,'') || ' ' || member_deductions.member_name))
      = lower(trim(m.name))
)
WHERE member_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_member_deductions_member_year
  ON member_deductions(member_id, year);
