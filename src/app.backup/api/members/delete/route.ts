import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(req: NextRequest) {
  const db = getDb();
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

  // Soft delete - mark as inactive
  await db.execute({ 
    sql: "UPDATE members SET status = 'inactive' WHERE id = ?",
    args: [id]
  });
  return NextResponse.json({ success: true });
}
