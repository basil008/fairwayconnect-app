import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
  const db = getDb();
  const body = await req.json();
  const { name, course_name, date, first_tee, format, entry_fee, location, prize_fund, notes } = body;

  if (!name || !course_name || !date) {
    return NextResponse.json({ error: 'Name, course, and date required' }, { status: 400 });
  }

  const societyResult = await db.execute('SELECT id FROM societies LIMIT 1');
  const societyId = (societyResult.rows[0] as unknown as { id: string })?.id || 'soc_oscar_001';

  const seasonResult = await db.execute("SELECT id FROM seasons WHERE status = 'active' ORDER BY year DESC LIMIT 1");
  const season = seasonResult.rows[0] as unknown as { id: string } | undefined;
  const seasonId = season?.id || null;

  // Get next event number
  const maxNumResult = await db.execute({ sql: 'SELECT MAX(event_number) as n FROM events WHERE season_id = ?', args: [seasonId] });
  const maxNum = (maxNumResult.rows[0] as unknown as { n: number | null })?.n || 0;

  const eventId = uuidv4();
  const defaultPrizes = {
    prizes: [
      { type: 'overall', position: 1, label: '1st Overall', value: 50 },
      { type: 'overall', position: 2, label: '2nd Overall', value: 30 },
      { type: 'overall', position: 3, label: '3rd Overall', value: 20 },
      { type: 'division_a', position: 1, label: 'Division A Winner (0-14 hcp)', value: 0 },
      { type: 'division_b', position: 1, label: 'Division B Winner (15-28 hcp)', value: 0 },
      { type: 'best_visitor', position: 1, label: 'Best Visitor', value: 0 },
    ],
  };

  await db.execute({
    sql: `
      INSERT INTO events (id, society_id, name, course_name, date, format, entry_fee, first_tee, status, prize_config, season_id, event_number, location, prize_fund, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'upcoming', ?, ?, ?, ?, ?, ?)
    `,
    args: [eventId, societyId, name, course_name, date, format || 'Stableford',
           entry_fee || 0, first_tee || '09:30', JSON.stringify(defaultPrizes),
           seasonId, maxNum + 1, location || '', prize_fund || 0, notes || '']
  });

  return NextResponse.json({ success: true, id: eventId }, { status: 201 });
}
