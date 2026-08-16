import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// ALGS Order of Merit: Best 6 of 8 Stableford totals
const BEST_OF_COUNT = 6;

export async function POST() {
  const db = getDb();
  const seasonResult = await db.execute("SELECT * FROM seasons WHERE status = 'active' ORDER BY year DESC LIMIT 1");
  const season = seasonResult.rows[0] as Record<string, unknown> | undefined;
  if (!season) return NextResponse.json({ error: 'No active season' }, { status: 404 });

  const seasonId = season.id as string;

  // Get all finalised events in this season
  const eventsResult = await db.execute({
    sql: `SELECT id, name FROM events WHERE season_id = ? AND status = 'finalised' ORDER BY event_number`,
    args: [seasonId]
  });
  const events = eventsResult.rows as unknown as Array<{ id: string; name: string }>;

  // Clear existing standings and player_event_stats
  await db.execute({ sql: 'DELETE FROM season_standings WHERE season_id = ?', args: [seasonId] });
  await db.execute({ sql: 'DELETE FROM player_event_stats WHERE event_id IN (SELECT id FROM events WHERE season_id = ?)', args: [seasonId] });

  // Collect each member's Stableford totals per event
  const memberTotals: Record<string, {
    stablefordScores: number[];  // Stableford total per event
    events: string[];
    finishes: number[];
    grossTotals: number[];
    handicaps: number[];
    wins: number;
    top3: number;
    ntpWins: number;
    ldWins: number;
    prizes: string[][];
  }> = {};

  for (const evt of events) {
    // Get submitted scorecards sorted by Stableford points
    const scorecardsResult = await db.execute({
      sql: `
        SELECT s.*, m.name, m.handicap, m.member_type
        FROM scorecards s JOIN members m ON m.id = s.member_id
        WHERE s.event_id = ? AND s.status = 'submitted' AND m.member_type != 'visitor'
        ORDER BY s.total_points DESC, s.total_gross ASC
      `,
      args: [evt.id]
    });
    const scorecards = scorecardsResult.rows as unknown as Array<{
      id: string; member_id: string; total_points: number; total_gross: number;
      name: string; handicap: number; member_type: string;
    }>;

    // Get side comps for tracking
    const sideCompsResult = await db.execute({ sql: 'SELECT * FROM side_comps WHERE event_id = ?', args: [evt.id] });
    const sideComps = sideCompsResult.rows as unknown as Array<{
      type: string; member_id: string;
    }>;

    for (let i = 0; i < scorecards.length; i++) {
      const sc = scorecards[i];
      const position = i + 1;

      // Track NTP/LD wins
      let ntpW = 0;
      let ldW = 0;
      const memberSideComps = sideComps.filter(c => c.member_id === sc.member_id);
      for (const comp of memberSideComps) {
        if (comp.type === 'ntp') { ntpW++; }
        if (comp.type === 'longest_drive') { ldW++; }
      }

      // Prizes
      const prizesResult = await db.execute({
        sql: `SELECT label FROM prize_allocations WHERE event_id = ? AND member_id = ?`,
        args: [evt.id, sc.member_id]
      });
      const prizes = prizesResult.rows as unknown as Array<{ label: string }>;

      // Insert player_event_stats - store actual Stableford total
      const { v4: uuidv4 } = require('uuid');
      await db.execute({
        sql: `
          INSERT OR REPLACE INTO player_event_stats (id, event_id, member_id, position, points_earned, stableford_total, gross_total, handicap_at_event, prizes_won)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        args: [uuidv4(), evt.id, sc.member_id, position, sc.total_points, sc.total_points, sc.total_gross, sc.handicap,
               JSON.stringify(prizes.map(p => p.label))]
      });

      if (!memberTotals[sc.member_id]) {
        memberTotals[sc.member_id] = { stablefordScores: [], events: [], finishes: [], grossTotals: [], handicaps: [], wins: 0, top3: 0, ntpWins: 0, ldWins: 0, prizes: [] };
      }

      const mt = memberTotals[sc.member_id];
      mt.stablefordScores.push(sc.total_points);  // Actual Stableford points
      mt.events.push(evt.id);
      mt.finishes.push(position);
      mt.grossTotals.push(sc.total_gross);
      mt.handicaps.push(sc.handicap);
      if (position === 1) mt.wins++;
      if (position <= 3) mt.top3++;
      mt.ntpWins += ntpW;
      mt.ldWins += ldW;
      mt.prizes.push(prizes.map(p => p.label));
    }
  }

  // Calculate OOM standings: Best 6 Stableford scores
  const standings: Array<{ memberId: string; totalPoints: number; countingEvents: string[]; avgCountingScore: number }> = [];

  for (const [memberId, mt] of Object.entries(memberTotals)) {
    let totalPoints: number;
    let countingEvents: string[];
    let avgCountingScore: number;

    if (mt.stablefordScores.length > BEST_OF_COUNT) {
      // Sort by Stableford score descending and take best 6
      const indexed = mt.stablefordScores.map((pts, i) => ({ pts, eventId: mt.events[i] }));
      indexed.sort((a, b) => b.pts - a.pts);
      const best = indexed.slice(0, BEST_OF_COUNT);
      totalPoints = best.reduce((sum, b) => sum + b.pts, 0);
      countingEvents = best.map(b => b.eventId);
      avgCountingScore = totalPoints / BEST_OF_COUNT;
    } else {
      // Less than 6 events played - all count
      totalPoints = mt.stablefordScores.reduce((sum, p) => sum + p, 0);
      countingEvents = mt.events;
      avgCountingScore = mt.stablefordScores.length > 0 ? totalPoints / mt.stablefordScores.length : 0;
    }

    standings.push({ memberId, totalPoints, countingEvents, avgCountingScore });
  }

  // Sort by total points descending, then best single score as tiebreaker
  standings.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    // Tiebreaker: best single Stableford score
    const bestA = Math.max(...memberTotals[a.memberId].stablefordScores);
    const bestB = Math.max(...memberTotals[b.memberId].stablefordScores);
    return bestB - bestA;
  });

  // Insert standings
  const { v4: uuidv4 } = require('uuid');
  for (let i = 0; i < standings.length; i++) {
    const s = standings[i];
    const mt = memberTotals[s.memberId];
    const avgScore = mt.stablefordScores.reduce((a, b) => a + b, 0) / mt.stablefordScores.length;
    const bestScore = Math.max(...mt.stablefordScores);

    await db.execute({
      sql: `
        INSERT INTO season_standings (id, season_id, member_id, total_points, events_played, best_finish, wins, top_3, avg_score, best_score, ntp_wins, ld_wins, position, prev_position, counting_events)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [uuidv4(), seasonId, s.memberId,
             s.totalPoints,
             mt.events.length,
             Math.min(...mt.finishes),
             mt.wins, mt.top3,
             Math.round(avgScore * 10) / 10,
             bestScore,
             mt.ntpWins, mt.ldWins,
             i + 1, 0,
             JSON.stringify(s.countingEvents)]
    });
  }

  return NextResponse.json({ 
    success: true, 
    message: `OOM recalculated: Best ${BEST_OF_COUNT} Stableford totals for ${standings.length} players across ${events.length} events` 
  });
}
