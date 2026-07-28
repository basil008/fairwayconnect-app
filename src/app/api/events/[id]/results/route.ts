import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// Prize display order for Captain's/President's Prize
const PRIZE_DISPLAY_ORDER: Record<string, number> = {
  'overall': 0,        // 1st, 2nd, (3rd comes after classes due to position)
  'class_1': 10,       // Class 1 - 1st & 2nd
  'class_2': 20,       // Class 2 - 1st & 2nd
  'front_9': 40,       // Front 9
  'back_9': 50,        // Back 9
  'ntp': 60,           // Nearest the Pin
  'longest_drive': 70, // Longest Drive
  'twos': 80,          // Twos
  'visitors': 90,      // Visitors Prize
  'past_captains': 85, // Past Captain's Prize
  'division_a': 100,
  'division_b': 110,
  'best_visitor': 120,
  'third_overall': 30, // Legacy - should not be used (use 'overall' + position 3)
};

// Helper function to calculate countback scores
// ALGS Standard: Back 9 → Back 6 → Gross Score
async function getCountbackScores(db: any, scorecardId: string) {
  try {
    const holesResult = await db.execute({
      sql: `SELECT hole_number, stableford_points FROM hole_scores WHERE scorecard_id = ? ORDER BY hole_number`,
      args: [scorecardId]
    });
    
    const holes = holesResult.rows as Array<{ hole_number: number; stableford_points: number }>;
    
    // Calculate back 9 (holes 10-18)
    const back9 = holes
      .filter(h => h.hole_number >= 10 && h.hole_number <= 18)
      .reduce((sum, h) => sum + (h.stableford_points || 0), 0);
    
    // Calculate back 6 (holes 13-18)
    const back6 = holes
      .filter(h => h.hole_number >= 13 && h.hole_number <= 18)
      .reduce((sum, h) => sum + (h.stableford_points || 0), 0);
    
    return { back9, back6 };
  } catch (err) {
    console.error('Countback calculation error for scorecard', scorecardId, ':', err);
    return { back9: 0, back6: 0 }; // Return zeros if calculation fails
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();

  try {
    // Get event details
    const eventResult = await db.execute({
      sql: `SELECT e.id, e.name, e.date, e.format, e.status, e.results_published, 
                    e.course_id, e.prize_config, e.season_id, c.name as course_name 
            FROM events e 
            LEFT JOIN courses c ON e.course_id = c.id 
            WHERE e.id = ?`,
      args: [id]
    });
    
    if (eventResult.rows.length === 0) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const event = eventResult.rows[0];
    console.log('📊 Event data from DB:', JSON.stringify({id, status: event.status, results_published: event.results_published, type: typeof event.results_published}));

    // Get all scorecards with member names (exclude empty/reset scorecards AND visitors)
    // Only include submitted scorecards with valid data (total_points > 0 AND total_gross > 0)
    const scorecardsResult = await db.execute({
      sql: `SELECT sc.*, m.name, m.handicap
            FROM scorecards sc
            JOIN members m ON sc.member_id = m.id
            WHERE sc.event_id = ? 
              AND sc.status = 'submitted'
              AND sc.total_points > 0 
              AND sc.total_gross > 0
              AND (m.member_type IS NULL OR m.member_type != 'visitor')`,
      args: [id]
    });

    // Get event number for per-outing deduction calculation
    const eventNumber = (event.event_number as number) || 1;

    // Get deductions — cumulative UP TO this outing
    const deductionsResult = await db.execute({
      sql: `SELECT member_name, first_name, year_starting_deduction,
        outing_1, outing_2, outing_3, outing_4, outing_5, outing_6, outing_7, outing_8
        FROM member_deductions WHERE year = ?`,
      args: [new Date().getFullYear()]
    });
    const deductionMap = new Map<string, number>();
    for (const row of deductionsResult.rows) {
      const r = row as Record<string, unknown>;
      const name = ((r.member_name as string) || '').trim();
      const firstName = ((r.first_name as string) || '').trim();
      let total = Number(r.year_starting_deduction) || 0;
      for (let i = 1; i < eventNumber; i++) {
        total += Number(r[`outing_${i}`]) || 0;
      }
      if (name) deductionMap.set(name.toLowerCase(), total);
      if (firstName && name) deductionMap.set(`${firstName} ${name}`.toLowerCase().trim(), total);
    }

    // Get prizes (from prize_allocations if published, else auto-calculate)
    const prizesResult = await db.execute({
      sql: `SELECT pa.*, m.name as member_name
            FROM prize_allocations pa
            LEFT JOIN members m ON pa.member_id = m.id
            WHERE pa.event_id = ?`,
      args: [id]
    });
    
    let calculatedPrizes = prizesResult.rows
      .map(row => ({
        prize_type: row.prize_type,
        position: row.position,
        label: row.label,
        value: row.value || 0,
        member_name: row.member_name,
      }))
      .sort((a, b) => {
        // Get base order for prize types
        let aOrder = PRIZE_DISPLAY_ORDER[a.prize_type as string] ?? 999;
        let bOrder = PRIZE_DISPLAY_ORDER[b.prize_type as string] ?? 999;
        
        // Special case: 3rd Overall (prize_type='overall', position=3) should sort AFTER class prizes
        if (a.prize_type === 'overall' && a.position === 3) aOrder = 30; // After class_2 (20)
        if (b.prize_type === 'overall' && b.position === 3) bOrder = 30;
        
        if (aOrder !== bOrder) return aOrder - bOrder;
        
        // Within same type, sort by position (1, 2)
        const aPos = (a.position as number) ?? 999;
        const bPos = (b.position as number) ?? 999;
        return aPos - bPos;
      });
    
    // If no prizes allocated, auto-calculate from scorecards
    if (calculatedPrizes.length === 0 && scorecardsResult.rows.length > 0) {
      // Get countback scores for all scorecards
      const scorecardsWithCountback = await Promise.all(
        scorecardsResult.rows.map(async (row) => {
          const nameLower = ((row.name as string) || '').trim().toLowerCase();
          const surname = ((row.name as string) || '').trim().split(' ').slice(-1)[0].toLowerCase();
          const deduction = deductionMap.get(nameLower) || deductionMap.get(surname) || 0;
          const rawPts = (row.total_points as number) || 0;
          const netPts = rawPts + deduction;
          const countback = await getCountbackScores(db, row.id as string);
          return { ...row, netPts, deduction, rawPts, ...countback };
        })
      );
      
      // Sort by: 1) points, 2) back 9, 3) back 6, 4) gross score (lower is better)
      const sorted = scorecardsWithCountback.sort((a, b) => {
        // 1. Points (higher is better)
        if (b.netPts !== a.netPts) return b.netPts - a.netPts;
        // 2. Back 9 countback (higher is better)
        if (b.back9 !== a.back9) return b.back9 - a.back9;
        // 3. Back 6 countback (higher is better)
        if (b.back6 !== a.back6) return b.back6 - a.back6;
        // 4. Gross score (lower is better)
        return (a.total_gross as number) - (b.total_gross as number);
      });
      
      // Top 3 overall
      if (sorted.length >= 1) {
        calculatedPrizes.push({
          prize_type: 'overall',
          position: 1,
          label: `🥇 1st — ${sorted[0].name} (${sorted[0].netPts} pts)`,
          value: 80,
          member_name: sorted[0].name as string
        });
      }
      if (sorted.length >= 2) {
        calculatedPrizes.push({
          prize_type: 'overall',
          position: 2,
          label: `🥈 2nd — ${sorted[1].name} (${sorted[1].netPts} pts)`,
          value: 60,
          member_name: sorted[1].name as string
        });
      }
      if (sorted.length >= 3) {
        calculatedPrizes.push({
          prize_type: 'overall',
          position: 3,
          label: `🥉 3rd — ${sorted[2].name} (${sorted[2].netPts} pts)`,
          value: 40,
          member_name: sorted[2].name as string
        });
      }
      
      // Front 9 & Back 9 winners (excluding overall winners - one prize per member)
      try {
        // Get names of overall winners to exclude (they already won a prize)
        const overallWinners = calculatedPrizes
          .filter(p => p.prize_type === 'overall')
          .map(p => p.member_name);
        
        // Front 9: Sum stableford points for holes 1-9
        const front9Result = await db.execute({
          sql: `SELECT m.name, SUM(hs.stableford_points) as points
                FROM hole_scores hs
                JOIN scorecards sc ON hs.scorecard_id = sc.id
                JOIN members m ON sc.member_id = m.id
                WHERE sc.event_id = ? AND hs.hole_number BETWEEN 1 AND 9
                GROUP BY sc.member_id
                ORDER BY points DESC`,
          args: [id]
        });
        
        // Find first player who didn't win overall
        const front9Winner = front9Result.rows.find((p: any) => !overallWinners.includes(p.name));
          
        if (front9Winner) {
          calculatedPrizes.push({
            prize_type: 'front_9',
            position: 1,
            label: `⛳ Front 9 — ${front9Winner.name} (${front9Winner.points} pts)`,
            value: 25,
            member_name: front9Winner.name
          });
        }
        
        // Back 9: Sum stableford points for holes 10-18
        const back9Result = await db.execute({
          sql: `SELECT m.name, SUM(hs.stableford_points) as points
                FROM hole_scores hs
                JOIN scorecards sc ON hs.scorecard_id = sc.id
                JOIN members m ON sc.member_id = m.id
                WHERE sc.event_id = ? AND hs.hole_number BETWEEN 10 AND 18
                GROUP BY sc.member_id
                ORDER BY points DESC`,
          args: [id]
        });
        
        // Exclude overall winners AND front 9 winner (one prize per member)
        const excludedWinners = [...overallWinners];
        if (front9Winner) excludedWinners.push(front9Winner.name);
        
        const back9Winner = back9Result.rows.find((p: any) => !excludedWinners.includes(p.name));
          
        if (back9Winner) {
          calculatedPrizes.push({
            prize_type: 'back_9',
            position: 1,
            label: `⛳ Back 9 — ${back9Winner.name} (${back9Winner.points} pts)`,
            value: 25,
            member_name: back9Winner.name
          });
        }
      } catch (err) {
        console.error('❌ Front/Back 9 calculation error:', err);
        console.log('ℹ️ Could not calculate Front/Back 9 winners (hole scores may not exist)');
      }
    }

    // Get side competitions
    const sideCompsResult = await db.execute({
      sql: `SELECT sc.*, m.name as member_name
            FROM side_comps sc
            LEFT JOIN members m ON sc.member_id = m.id
            WHERE sc.event_id = ?
            ORDER BY sc.type, sc.hole_number`,
      args: [id]
    });
    
    // Add twos to prizes if not already published
    if (prizesResult.rows.length === 0) {
      for (const comp of sideCompsResult.rows) {
        if ((comp.type as string) === 'twos' && comp.member_name) {
          calculatedPrizes.push({
            prize_type: 'twos',
            position: null,
            label: `🏆 Two — Hole ${comp.hole_number} — ${comp.member_name}`,
            value: 0,
            member_name: comp.member_name as string
          });
        }
      }
    }

    // Sort prizes ONLY if auto-calculated (don't re-sort finalized prizes)
    if (prizesResult.rows.length === 0) {
      calculatedPrizes.sort((a, b) => {
        const orderA = PRIZE_DISPLAY_ORDER[a.prize_type] || 99;
        const orderB = PRIZE_DISPLAY_ORDER[b.prize_type] || 99;
        
        if (orderA !== orderB) return orderA - orderB;
        // Within same type, sort by position
        if (a.position && b.position) return a.position - b.position;
        return 0;
      });
    }

    return NextResponse.json({
      event: {
        id: event.id,
        name: event.name,
        course_name: event.course_name,
        date: event.date,
        format: event.format,
        status: event.status,
        results_published: event.results_published || 0, // Return publish status
      },
      scorecards: await Promise.all(
        scorecardsResult.rows.map(async (row) => {
          const nameLower = ((row.name as string) || '').trim().toLowerCase();
          const surname = ((row.name as string) || '').trim().split(' ').slice(-1)[0].toLowerCase();
          const deduction = deductionMap.get(nameLower) || 0;
          const rawPts = (row.total_points as number) || 0;
          const adjustedPts = rawPts + deduction; // For event prizes only
          const countback = await getCountbackScores(db, row.id as string);
          return {
            member_id: row.member_id,
            name: row.name,
            handicap: row.handicap,
            total_points: adjustedPts, // Event ranking uses adjusted
            raw_points: rawPts, // GOTY uses raw
            deduction,
            total_gross: row.total_gross || 0,
            holes_completed: row.holes_completed || 0,
            status: row.status,
            back9: countback.back9,
            back6: countback.back6,
          };
        })
      ).then(cards => cards.sort((a, b) => {
        // 1. Points (higher is better)
        if (b.total_points !== a.total_points) return b.total_points - a.total_points;
        // 2. Back 9 countback (higher is better)
        if (b.back9 !== a.back9) return b.back9 - a.back9;
        // 3. Back 6 countback (higher is better)
        if (b.back6 !== a.back6) return b.back6 - a.back6;
        // 4. Gross score (lower is better)
        return a.total_gross - b.total_gross;
      })),
      prizes: calculatedPrizes,
      sideComps: sideCompsResult.rows.map(row => ({
        type: row.type,
        hole_number: row.hole_number,
        member_name: row.member_name,
        value: row.value,
        unit: row.unit,
      })),
    });
  } catch (error) {
    console.error('❌ Error fetching event results:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('Error details:', { message: errorMessage, stack: errorStack });
    return NextResponse.json({ 
      error: 'Failed to fetch results',
      details: errorMessage 
    }, { status: 500 });
  }
}
