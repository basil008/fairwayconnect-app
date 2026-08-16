const https = require('https');

const query = `
UPDATE course_scorecard_metadata 
SET slope_rating = 130, course_rating = 72.2
WHERE course_name = 'Ashbourne Golf Club';

UPDATE events 
SET slope_rating = 130, course_rating = 72.2
WHERE date = '2026-05-18';
`;

console.log('Sending fix to Turso database...');
console.log('Query:', query);
