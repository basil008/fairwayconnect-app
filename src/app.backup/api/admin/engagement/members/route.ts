import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = getDb();
    
    // Get all members with their engagement stats
    const result = await db.execute({
      sql: `
        SELECT 
          m.name,
          m.member_pin,
          m.last_login_at,
          m.login_count,
          m.first_login_at,
          (SELECT COUNT(*) FROM rsvps WHERE member_id = m.id AND created_by = 'member') as self_rsvp_count,
          (SELECT COUNT(*) FROM rsvps WHERE member_id = m.id AND created_by = 'admin') as admin_rsvp_count,
          CASE
            WHEN m.last_login_at IS NULL THEN 'None'
            WHEN m.login_count >= 20 THEN 'High'
            WHEN m.login_count >= 10 THEN 'Medium'
            ELSE 'Low'
          END as engagement_level
        FROM members m
        ORDER BY m.login_count DESC, m.name ASC
      `,
      args: []
    });
    
    return NextResponse.json(result.rows);
    
  } catch (error) {
    console.error('❌ Engagement members API error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch engagement data',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
