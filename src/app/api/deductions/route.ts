import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import Database from 'better-sqlite3';

export async function GET(request: Request) {
  try {
    console.log('🏌️ Deductions/handicaps API called');
    const db = getDb();
    const url = new URL(request.url);
    const year = url.searchParams.get('year') || '2026';
    
    // Get all members with their current handicaps
    const membersResult = await db.execute({
      sql: 'SELECT id, name, handicap FROM members WHERE status = ? ORDER BY name',
      args: ['active']
    });
    
    // Get deductions from the authoritative member_deductions table
    const deductionsResult = await db.execute({
      sql: `
        SELECT 
          first_name,
          member_name,
          year_starting_deduction,
          outing_1, outing_2, outing_3, outing_4,
          outing_5, outing_6, outing_7, outing_8
        FROM member_deductions
        WHERE year = ?
      `,
      args: [parseInt(year)]
    });
    
    // Create a map of deductions by member name
    // NOTE: member_deductions uses LAST NAME only, members table uses FULL NAME
    const deductionsMap = new Map();
    for (const row of deductionsResult.rows) {
      const record: any = row;
      
      // Calculate total deductions across all outings
      const outingDeductions = (record.outing_1 || 0) + (record.outing_2 || 0) + 
                               (record.outing_3 || 0) + (record.outing_4 || 0) +
                               (record.outing_5 || 0) + (record.outing_6 || 0) +
                               (record.outing_7 || 0) + (record.outing_8 || 0);
      
      const startDeduction = record.year_starting_deduction || 0;
      const totalDeductions = startDeduction + outingDeductions;
      
      // Count events played (non-zero outing entries)
      let eventsPlayed = 0;
      let earnedBack = 0;
      let netDeductions = 0;
      
      for (let i = 1; i <= 8; i++) {
        const outingKey = `outing_${i}`;
        const outingValue = record[outingKey] || 0;
        if (outingValue !== 0) {
          eventsPlayed++;
          if (outingValue > 0) earnedBack += outingValue;
          if (outingValue < 0) netDeductions += outingValue;
        }
      }
      
      // Store by last name for matching
      // Use full name as key to handle multiple people with same last name
      const fullName = `${record.first_name || ''} ${record.member_name || ''}`.trim();
      deductionsMap.set(fullName, {
        start: startDeduction,
        event_1: record.outing_1 || 0,
        event_2: record.outing_2 || 0,
        event_3: record.outing_3 || 0,
        event_4: record.outing_4 || 0,
        event_5: record.outing_5 || 0,
        event_6: record.outing_6 || 0,
        event_7: record.outing_7 || 0,
        event_8: record.outing_8 || 0,
        total: totalDeductions,
        events_played: eventsPlayed,
        earned_back: earnedBack,
        net_deductions: netDeductions
      });
    }
    
    // Build member list with deductions
    const members = membersResult.rows.map((member: any) => {
      // Match by full name to handle multiple people with same last name
      const fullName = member.name.trim();
      const ded = deductionsMap.get(fullName) || {
        start: 0, event_1: 0, event_2: 0, event_3: 0, event_4: 0,
        event_5: 0, event_6: 0, event_7: 0, event_8: 0,
        total: 0, events_played: 0, earned_back: 0, net_deductions: 0
      };
      
      // Deductions are NEGATIVE numbers that reduce handicap
      // e.g., -3 means 3 shots better (lower handicap)
      const adjustedHandicap = member.handicap + ded.total;
      
      return {
        member_id: member.id,
        member_name: member.name,
        current_handicap: member.handicap,
        start_handicap: member.handicap,
        year_starting_deduction: ded.start, // Starting deduction for the year
        deductions: Math.abs(ded.net_deductions), // Show as positive number
        earned_back: ded.earned_back,
        net_adjustment: ded.total,
        adjusted_handicap: adjustedHandicap,
        events_played: ded.events_played,
        event_1: ded.event_1,
        event_2: ded.event_2,
        event_3: ded.event_3,
        event_4: ded.event_4,
        event_5: ded.event_5,
        event_6: ded.event_6,
        event_7: ded.event_7,
        event_8: ded.event_8
      };
    });
    
    console.log(`✅ Found ${members.length} members for handicap adjustments`);
    
    return NextResponse.json({
      season_id: `season_${year}`,
      season_name: `ALGS ${year} Season`,
      members
    });
    
  } catch (error) {
    console.error('❌ Deductions API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch deductions', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, id, field, value, year } = body;

    if (action !== 'update') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Get database connection (Turso in production, SQLite locally)
    const db = getDb();

    // Get member name from members table using id
    const memberResult = await db.execute({
      sql: 'SELECT name FROM members WHERE id = ?',
      args: [id]
    });
    
    if (!memberResult.rows || memberResult.rows.length === 0) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }
    
    const member = memberResult.rows[0] as any;

    // Extract last name (member_deductions uses last name only)
    const lastName = member.name.split(' ').pop()?.trim() || '';
    const currentYear = year || new Date().getFullYear();

    // Check if deduction record exists
    const checkResult = await db.execute({
      sql: 'SELECT id FROM member_deductions WHERE member_name = ? AND year = ?',
      args: [lastName, currentYear]
    });

    if (!checkResult.rows || checkResult.rows.length === 0) {
      // Create new record
      const firstName = member.name.split(' ').slice(0, -1).join(' ') || '';
      const newId = `ded_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await db.execute({
        sql: `INSERT INTO member_deductions (
          id, member_name, first_name, year, year_starting_deduction,
          outing_1, outing_2, outing_3, outing_4, outing_5, outing_6, outing_7, outing_8
        ) VALUES (?, ?, ?, ?, ?, 0, 0, 0, 0, 0, 0, 0, 0)`,
        args: [newId, lastName, firstName, currentYear, 0]
      });
    }

    // Validate field name to prevent SQL injection
    const validFields = [
      'year_starting_deduction', 'outing_1', 'outing_2', 'outing_3', 'outing_4',
      'outing_5', 'outing_6', 'outing_7', 'outing_8'
    ];
    
    if (!validFields.includes(field)) {
      return NextResponse.json({ error: 'Invalid field' }, { status: 400 });
    }

    // Update the specific field
    await db.execute({
      sql: `UPDATE member_deductions SET ${field} = ? WHERE member_name = ? AND year = ?`,
      args: [value, lastName, currentYear]
    });

    console.log(`✅ Updated ${lastName} ${field} = ${value}`);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('❌ Deductions update error:', error);
    return NextResponse.json(
      { error: 'Failed to update deductions', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
