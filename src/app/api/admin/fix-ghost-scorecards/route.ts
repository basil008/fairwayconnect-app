import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Admin endpoint to delete ghost scorecards (Event 6 Skerries - withdrawn players)
 * 
 * Problem: John Keogh, Harry Cavanagh, Tony Higgins were removed from tee sheet
 * before Event 6 started, but their scorecards (with gross=0) were not deleted.
 * This caused them to appear in GOTY standings incorrectly.
 * 
 * Fix: Delete their Event 6 scorecards by member_id + event_id
 */
export async function POST(request: Request) {
  try {
    const db = getDb();
    const { pin, dryRun = true } = await request.json();
    
    // Security: require admin PIN
    if (pin !== '2026') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const event6Id = 'fd7e7eac-cd65-4ba9-b048-6741a7230425'; // Skerries
    
    // Get member IDs for the 3 problem players
    const membersResult = await db.execute({
      sql: `SELECT id, name FROM members WHERE name IN (?, ?, ?)`,
      args: ['John Keogh', 'Harry Cavanagh', 'Tony Higgins']
    });
    
    const members = membersResult.rows;
    
    if (members.length !== 3) {
      return NextResponse.json({ 
        error: 'Could not find all 3 members',
        found: members.map(m => m.name)
      }, { status: 404 });
    }

    // Find the ghost scorecards
    const ghostCardsResult = await db.execute({
      sql: `
        SELECT s.*, m.name 
        FROM scorecards s
        JOIN members m ON s.member_id = m.id
        WHERE s.event_id = ? 
          AND s.member_id IN (?, ?, ?)
      `,
      args: [event6Id, members[0].id, members[1].id, members[2].id]
    });
    
    const ghostCards = ghostCardsResult.rows;
    
    if (dryRun) {
      return NextResponse.json({
        dryRun: true,
        message: 'DRY RUN - No changes made',
        ghostCardsFound: ghostCards.length,
        scorecards: ghostCards.map(sc => ({
          member_id: sc.member_id,
          name: sc.name,
          event_id: sc.event_id,
          total_points: sc.total_points,
          total_gross: sc.total_gross,
          created_at: sc.created_at
        })),
        nextStep: 'Call again with { "pin": "2026", "dryRun": false } to delete'
      });
    }
    
    // ACTUAL DELETE - must delete hole_scores first (foreign key constraint)
    // Step 1: Delete hole_scores for these scorecards
    await db.execute({
      sql: `
        DELETE FROM hole_scores 
        WHERE scorecard_id IN (
          SELECT id FROM scorecards 
          WHERE event_id = ? 
            AND member_id IN (?, ?, ?)
        )
      `,
      args: [event6Id, members[0].id, members[1].id, members[2].id]
    });
    
    // Step 2: Delete the scorecards themselves
    const deleteResult = await db.execute({
      sql: `
        DELETE FROM scorecards 
        WHERE event_id = ? 
          AND member_id IN (?, ?, ?)
      `,
      args: [event6Id, members[0].id, members[1].id, members[2].id]
    });
    
    return NextResponse.json({
      success: true,
      deleted: ghostCards.length,
      scorecards: ghostCards.map(sc => ({
        name: sc.name,
        points: sc.total_points,
        gross: sc.total_gross
      })),
      message: `Deleted ${ghostCards.length} ghost scorecards. GOTY will recalculate on next page load.`
    });
    
  } catch (error) {
    console.error('❌ Fix ghost scorecards error:', error);
    return NextResponse.json({ 
      error: 'Failed to fix ghost scorecards',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
