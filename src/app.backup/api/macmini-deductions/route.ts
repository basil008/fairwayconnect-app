import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('🏌️ Mac Mini Deductions API - Using original member_deductions');
    const db = getDb();

    // Get member deductions directly from Mac Mini data (exact match)
    const deductionsResult = await db.execute({
      sql: 'SELECT * FROM member_deductions WHERE year = ? ORDER BY member_name',
      args: [2026]
    });

    const deductions = deductionsResult.rows.map((row: any) => ({
      id: row.id,
      member_name: `${row.member_name}, ${row.first_name}`,
      first_name: row.first_name,
      year: row.year,
      year_starting_deduction: row.year_starting_deduction,
      outing_1: row.outing_1,
      outing_2: row.outing_2,
      outing_3: row.outing_3,
      outing_4: row.outing_4,
      outing_5: row.outing_5,
      outing_6: row.outing_6,
      outing_7: row.outing_7,
      outing_8: row.outing_8,
      current_deductions: (row.year_starting_deduction || 0) + 
                         (row.outing_1 || 0) + (row.outing_2 || 0) + 
                         (row.outing_3 || 0) + (row.outing_4 || 0) + 
                         (row.outing_5 || 0) + (row.outing_6 || 0) + 
                         (row.outing_7 || 0) + (row.outing_8 || 0)
    }));

    console.log(`✅ Mac Mini Deductions: ${deductions.length} members with deduction data`);

    return NextResponse.json({
      season_id: 'season_2026',
      season_name: 'ALGS 2026 Season',
      deductions
    });
    
  } catch (error) {
    console.error('❌ Mac Mini Deductions API error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch Mac Mini deductions', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}