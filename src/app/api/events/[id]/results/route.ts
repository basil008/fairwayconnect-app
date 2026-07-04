import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();

  try {
    // Get event details
    const eventResult = await db.execute({
      sql: `SELECT e.*, c.name as course_name 
            FROM events e 
            LEFT JOIN courses c ON e.course_id = c.id 
            WHERE e.id = ?`,
      args: [id]
    });
    
    if (eventResult.rows.length === 0) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const event = eventResult.rows[0];

    // Get all scorecards with member names (exclude empty/reset scorecards)
    const scorecardsResult = await db.execute({
      sql: `SELECT sc.*, m.name, m.handicap
            FROM scorecards sc
            JOIN members m ON sc.member_id = m.id
            WHERE sc.event_id = ? AND sc.total_points > 0`,
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
            WHERE pa.event_id = ?
            ORDER BY pa.prize_type, pa.position`,
      args: [id]
    });
    
    let calculatedPrizes = prizesResult.rows.map(row => ({
      prize_type: row.prize_type,
      position: row.position,
      label: row.label,
      value: row.value || 0,
      member_name: row.member_name,
    }));
    
    // If no prizes allocated, auto-calculate from scorecards
    if (calculatedPrizes.length === 0 && scorecardsResult.rows.length > 0) {
      // Sort by adjusted points (with deductions) then gross
      const sorted = [...scorecardsResult.rows]
        .map(row => {
          const nameLower = ((row.name as string) || '').trim().toLowerCase();
          const surname = ((row.name as string) || '').trim().split(' ').slice(-1)[0].toLowerCase();
          const deduction = deductionMap.get(nameLower) || deductionMap.get(surname) || 0;
          const rawPts = (row.total_points as number) || 0;
          const netPts = rawPts + deduction;
          return { ...row, netPts, deduction, rawPts };
        })
        .sort((a, b) => {
          if (b.netPts !== a.netPts) return b.netPts - a.netPts;
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

    return NextResponse.json({
      event: {
        id: event.id,
        name: event.name,
        course_name: event.course_name,
        date: event.date,
        format: event.format,
        status: event.status,
      },
      scorecards: scorecardsResult.rows.map(row => {
        const nameLower = ((row.name as string) || '').trim().toLowerCase();
        const surname = ((row.name as string) || '').trim().split(' ').slice(-1)[0].toLowerCase();
        const deduction = deductionMap.get(nameLower) || 0;
        const rawPts = (row.total_points as number) || 0;
        const adjustedPts = rawPts + deduction; // For event prizes only
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
        };
      }).sort((a, b) => (b.total_points as number) - (a.total_points as number)),
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
    console.error('Error fetching event results:', error);
    return NextResponse.json({ error: 'Failed to fetch results' }, { status: 500 });
  }
}
