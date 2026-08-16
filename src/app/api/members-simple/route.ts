import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    console.log('Simple members API called');
    const db = getDb();
    
    // Simple query to get all members
    const result = await db.execute('SELECT * FROM members ORDER BY name');
    
    console.log(`Found ${result.rows.length} members`);
    
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Simple members API error:', error);
    return NextResponse.json({ 
      error: 'Database query failed', 
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}