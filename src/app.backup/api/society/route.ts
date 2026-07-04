import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = getDb();
    const societyResult = await db.execute('SELECT * FROM societies LIMIT 1');
    const society = societyResult.rows[0];
    return NextResponse.json(society);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const stack = error instanceof Error ? error.stack : '';
    console.error('Society API Error:', message, stack);
    return NextResponse.json({ 
      error: message,
      envCheck: {
        hasUrl: !!process.env.TURSO_DATABASE_URL,
        hasToken: !!process.env.TURSO_AUTH_TOKEN,
        urlPrefix: process.env.TURSO_DATABASE_URL?.substring(0, 20)
      }
    }, { status: 500 });
  }
}
