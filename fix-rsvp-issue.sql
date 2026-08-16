-- Step 1: Clean up Jack McCabe's trailing space
UPDATE members 
SET name = TRIM(name) 
WHERE id = 'mem_1776803799733_g80fx3r1u';

-- Step 2: Verify the cleanup
SELECT id, name, LENGTH(name) as name_length 
FROM members 
WHERE id = 'mem_1776803799733_g80fx3r1u';

-- Step 3: Add RSVP for Jack McCabe
INSERT INTO rsvps (id, event_id, member_id, member_name, status, payment_status, created_at)
VALUES (
  'rsvp_jack_mccabe_stm',
  '6e52d8e4-94ae-467d-881c-5bda4b12e180',
  'mem_1776803799733_g80fx3r1u',
  'Jack McCabe',
  'confirmed',
  'unpaid',
  datetime('now')
);

-- Step 4: Add RSVP for Tony Higgins
INSERT INTO rsvps (id, event_id, member_id, member_name, status, payment_status, created_at)
VALUES (
  'rsvp_tony_higgins_stm',
  '6e52d8e4-94ae-467d-881c-5bda4b12e180',
  'db21676f-6f66-4af8-a429-1b7ccef9e35f',
  'Tony Higgins',
  'confirmed',
  'unpaid',
  datetime('now')
);

-- Step 5: Verify the fix
SELECT COUNT(*) as total_rsvps FROM rsvps WHERE event_id = '6e52d8e4-94ae-467d-881c-5bda4b12e180';
