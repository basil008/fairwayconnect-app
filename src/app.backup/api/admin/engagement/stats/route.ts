import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = getDb();
    
    // Get overall stats
    const memberStats = await db.execute({
      sql: `
        SELECT 
          COUNT(*) as total_members,
          SUM(CASE WHEN last_login_at IS NOT NULL THEN 1 ELSE 0 END) as logged_in,
          SUM(CASE WHEN last_login_at IS NULL THEN 1 ELSE 0 END) as never_logged_in
        FROM members
      `,
      args: []
    });
    
    const rsvpStats = await db.execute({
      sql: `
        SELECT 
          COUNT(*) as total_rsvps,
          SUM(CASE WHEN created_by = 'member' THEN 1 ELSE 0 END) as self_service_rsvps,
          SUM(CASE WHEN created_by = 'admin' THEN 1 ELSE 0 END) as admin_created_rsvps
        FROM rsvps
      `,
      args: []
    });
    
    const stats = {
      total_members: memberStats.rows[0]?.total_members || 0,
      logged_in: memberStats.rows[0]?.logged_in || 0,
      never_logged_in: memberStats.rows[0]?.never_logged_in || 0,
      total_rsvps: rsvpStats.rows[0]?.total_rsvps || 0,
      self_service_rsvps: rsvpStats.rows[0]?.self_service_rsvps || 0,
      admin_created_rsvps: rsvpStats.rows[0]?.admin_created_rsvps || 0
    };
    
    return NextResponse.json(stats);
    
  } catch (error) {
    console.error('❌ Engagement stats API error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch stats',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
