import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = getDb();
    
    // Get the current event
    const result = await db.execute(`
      SELECT e.id, e.name, c.name as course_name, e.date, e.status, e.results_published
      FROM events e
      LEFT JOIN courses c ON e.course_id = c.id
      WHERE e.status IN ('in_progress', 'finalised')
      ORDER BY e.date DESC
      LIMIT 5
    `);
    
    return NextResponse.json({ 
      events: result.rows,
      message: 'Last 5 active/finalised events with status fields'
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
