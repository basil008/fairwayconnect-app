import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(request: Request) {
  const db = getDb();
  const body = await request.json();
  const { updates } = body;

  if (!Array.isArray(updates)) {
    return NextResponse.json({ error: 'Invalid updates array' }, { status: 400 });
  }

  let count = 0;
  for (const update of updates) {
    const { firstName, lastName, outing, value } = update;
    
    try {
      await db.execute({
        sql: `UPDATE member_deductions 
              SET outing_${outing} = ? 
              WHERE first_name = ? AND member_name = ? AND year = 2026`,
        args: [value, firstName, lastName]
      });
      count++;
    } catch (err) {
      console.error(`Failed to update ${firstName} ${lastName}:`, err);
    }
  }

  return NextResponse.json({ success: true, updated: count });
}
