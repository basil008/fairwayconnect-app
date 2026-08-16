import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = getDb();
    
    // Test database connection
    const result = await db.execute('SELECT COUNT(*) as count FROM members');
    const memberCount = result.rows[0]?.count || 0;
    
    // Try to get a sample member
    const sampleResult = await db.execute('SELECT * FROM members LIMIT 3');
    
    return NextResponse.json({
      success: true,
      memberCount,
      sampleMembers: sampleResult.rows,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Test DB error:', error);
    return NextResponse.json({ 
      error: 'Database test failed', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}