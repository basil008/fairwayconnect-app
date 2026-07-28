import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = getDb();
    
    // Find events that have prize_allocations but results_published != 1
    // These are events that were finalized but not yet published
    const result = await db.execute(`
      SELECT DISTINCT e.*, c.name as course_name
      FROM events e
      LEFT JOIN courses c ON e.course_id = c.id
      WHERE e.id IN (
        SELECT DISTINCT event_id FROM prize_allocations
      )
      AND (e.results_published IS NULL OR e.results_published = 0)
      AND e.status = 'in_progress'
      ORDER BY e.date DESC
    `);
    
    return NextResponse.json({ events: result.rows });
  } catch (error) {
    console.error('Error fetching events awaiting publication:', error);
    return NextResponse.json({ error: 'Failed to fetch events', events: [] }, { status: 500 });
  }
}
