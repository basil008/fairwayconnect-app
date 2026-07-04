import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    console.log('📅 Events list API called');
    const db = getDb();
    
    // Get all events for admin dashboard
    const eventsResult = await db.execute('SELECT * FROM events ORDER BY date ASC');
    
    console.log(`✅ Found ${eventsResult.rows.length} events`);
    
    return NextResponse.json(eventsResult.rows);
    
  } catch (error) {
    console.error('❌ Events list API error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch events list', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}