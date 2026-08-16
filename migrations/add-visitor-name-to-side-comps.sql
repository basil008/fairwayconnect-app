-- Add visitor_name column to side_comps table
-- This allows manual name entry for visitors prizes without requiring a member_id

ALTER TABLE side_comps ADD COLUMN visitor_name TEXT;

-- Update the query to use visitor_name when member_name is NULL
-- The API will need to be updated to use COALESCE(m.name, sc.visitor_name) as member_name
