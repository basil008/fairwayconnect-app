import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const db = getDb();

  try {
    const result = await db.execute({
      sql: `SELECT id, tee_time, group_number, member_ids 
            FROM tee_times 
            WHERE event_id = ? 
            ORDER BY group_number ASC`,
      args: [id]
    });

    // Parse the member_ids JSON array for each tee time
    const teeTimes = result.rows.map((row: any) => ({
      id: row.id,
      time: row.tee_time,
      group_number: row.group_number,
      members: typeof row.member_ids === 'string' ? JSON.parse(row.member_ids) : row.member_ids
    }));

    return NextResponse.json(teeTimes);
  } catch (error) {
    console.error('Error fetching tee times:', error);
    return NextResponse.json([], { status: 500 });
  }
}
