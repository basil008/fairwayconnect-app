import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { seedDatabase } from '@/lib/seed';

export async function GET(request: Request) {
  await seedDatabase();
  const db = getDb();
  const url = new URL(request.url);
  
  let eventId = url.searchParams.get('event_id');
  if (!eventId) {
    const inProgressResult = await db.execute("SELECT id FROM events WHERE status = 'in_progress' ORDER BY date ASC LIMIT 1");
    eventId = inProgressResult.rows[0]?.id as string;

    if (!eventId) {
      const upcomingResult = await db.execute("SELECT id FROM events WHERE status = 'upcoming' ORDER BY date ASC LIMIT 1");
      eventId = upcomingResult.rows[0]?.id as string;
    }

    if (!eventId) {
      const finalisedResult = await db.execute("SELECT id FROM events WHERE status = 'finalised' ORDER BY date DESC LIMIT 1");
      eventId = finalisedResult.rows[0]?.id as string;
    }
  }

  if (!eventId) return NextResponse.json([]);

  const teeTimesResult = await db.execute({ sql: 'SELECT * FROM tee_times WHERE event_id = ? ORDER BY group_number', args: [eventId] });
  const teeTimes = teeTimesResult.rows as unknown as Array<{
    id: string; event_id: string; group_number: number; tee_time: string; member_ids: string;
  }>;

  const result = await Promise.all(teeTimes.map(async (tt) => {
    const memberIds = JSON.parse(tt.member_ids) as string[];
    const members = await Promise.all(memberIds.map(async (mid) => {
      const memberResult = await db.execute({ sql: 'SELECT id, name, handicap FROM members WHERE id = ?', args: [mid] });
      return memberResult.rows[0];
    }));
    return { ...tt, members: members.filter(Boolean) };
  }));

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const db = getDb();
  const body = await request.json();
  const { v4: uuidv4 } = await import('uuid');

  // Handle different actions
  if (body.action === 'move_player') {
    const { event_id, member_id, from_group, to_group } = body;
    
    // Remove from old group (if from_group > 0)
    if (from_group > 0) {
      const oldGroupResult = await db.execute({
        sql: 'SELECT id, member_ids FROM tee_times WHERE event_id = ? AND group_number = ?',
        args: [event_id, from_group]
      });
      if (oldGroupResult.rows[0]) {
        const oldMemberIds = JSON.parse(oldGroupResult.rows[0].member_ids as string) as string[];
        const newMemberIds = oldMemberIds.filter(id => id !== member_id);
        await db.execute({
          sql: 'UPDATE tee_times SET member_ids = ? WHERE id = ?',
          args: [JSON.stringify(newMemberIds), oldGroupResult.rows[0].id]
        });
      }
    }
    
    // Add to new group
    const newGroupResult = await db.execute({
      sql: 'SELECT id, member_ids FROM tee_times WHERE event_id = ? AND group_number = ?',
      args: [event_id, to_group]
    });
    if (newGroupResult.rows[0]) {
      const memberIds = JSON.parse(newGroupResult.rows[0].member_ids as string) as string[];
      if (!memberIds.includes(member_id)) {
        memberIds.push(member_id);
        await db.execute({
          sql: 'UPDATE tee_times SET member_ids = ? WHERE id = ?',
          args: [JSON.stringify(memberIds), newGroupResult.rows[0].id]
        });
      }
    }
    
    return NextResponse.json({ success: true });
  }

  if (body.action === 'remove_player') {
    const { event_id, member_id, group_number } = body;
    
    const groupResult = await db.execute({
      sql: 'SELECT id, member_ids FROM tee_times WHERE event_id = ? AND group_number = ?',
      args: [event_id, group_number]
    });
    if (groupResult.rows[0]) {
      const memberIds = JSON.parse(groupResult.rows[0].member_ids as string) as string[];
      const newMemberIds = memberIds.filter(id => id !== member_id);
      await db.execute({
        sql: 'UPDATE tee_times SET member_ids = ? WHERE id = ?',
        args: [JSON.stringify(newMemberIds), groupResult.rows[0].id]
      });
    }
    
    return NextResponse.json({ success: true });
  }

  if (body.action === 'add_group') {
    const { event_id, group_number, tee_time } = body;
    
    await db.execute({
      sql: 'INSERT INTO tee_times (id, event_id, group_number, tee_time, member_ids) VALUES (?, ?, ?, ?, ?)',
      args: [uuidv4(), event_id, group_number, tee_time, '[]']
    });
    
    return NextResponse.json({ success: true });
  }

  if (body.action === 'update_time') {
    const { group_id, tee_time } = body;
    
    await db.execute({
      sql: 'UPDATE tee_times SET tee_time = ? WHERE id = ?',
      args: [tee_time, group_id]
    });
    
    return NextResponse.json({ success: true });
  }

  if (body.action === 'delete_group') {
    const { group_id } = body;
    
    await db.execute({
      sql: 'DELETE FROM tee_times WHERE id = ?',
      args: [group_id]
    });
    
    return NextResponse.json({ success: true });
  }

  // Legacy: bulk replacement (for auto-generate)
  const { event_id, groups } = body;
  if (groups) {
    // Clear existing tee times
    await db.execute({ sql: 'DELETE FROM tee_times WHERE event_id = ?', args: [event_id] });

    for (const group of groups) {
      await db.execute({
        sql: 'INSERT INTO tee_times (id, event_id, group_number, tee_time, member_ids) VALUES (?, ?, ?, ?, ?)',
        args: [uuidv4(), event_id, group.group_number, group.tee_time, JSON.stringify(group.member_ids)]
      });
    }
  }

  return NextResponse.json({ success: true });
}
