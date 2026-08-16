import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: Request) {
  const db = getDb();
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get('eventId');
  const daysThreshold = parseInt(searchParams.get('days') || '30');

  try {
    // Get members who have RSVP'd for this event (if eventId provided)
    let memberFilter = '';
    let args: any[] = [];

    if (eventId) {
      memberFilter = `WHERE m.id IN (
        SELECT member_id FROM rsvps WHERE event_id = ? AND status = 'confirmed'
      )`;
      args = [eventId];
    }

    // Find members with stale or never-updated handicaps
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysThreshold);
    const cutoffISO = cutoffDate.toISOString();

    const result = await db.execute({
      sql: `
        SELECT 
          m.id,
          m.name,
          m.handicap,
          m.handicap_updated_at,
          CASE 
            WHEN m.handicap_updated_at IS NULL THEN 999999
            ELSE (julianday('now') - julianday(m.handicap_updated_at))
          END as days_since_update
        FROM members m
        ${memberFilter}
        ${memberFilter ? 'AND' : 'WHERE'} m.member_type != 'visitor'
        ${memberFilter ? 'AND' : 'AND'} (
          m.handicap_updated_at IS NULL 
          OR m.handicap_updated_at < ?
        )
        ORDER BY days_since_update DESC
      `,
      args: memberFilter ? [...args, cutoffISO] : [cutoffISO]
    });

    const staleMembers = result.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      handicap: row.handicap,
      lastUpdated: row.handicap_updated_at,
      daysAgo: row.handicap_updated_at 
        ? Math.floor((Date.now() - new Date(row.handicap_updated_at).getTime()) / (1000 * 60 * 60 * 24))
        : null
    }));

    return NextResponse.json({
      staleMembers,
      count: staleMembers.length,
      threshold: daysThreshold
    });

  } catch (error: any) {
    console.error('Check stale handicaps error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to check handicaps' 
    }, { status: 500 });
  }
}
