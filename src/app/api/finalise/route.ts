import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { countbackCompare } from '@/lib/stableford';
import { v4 as uuidv4 } from 'uuid';

// Helper to get society settings
async function getDeductionSettings(db: ReturnType<typeof getDb>) {
  const result = await db.execute(`
    SELECT key, value FROM society_settings 
    WHERE key IN ('deduction_1st', 'deduction_2nd', 'deduction_3rd', 'deduction_front9', 'deduction_back9')
  `);
  const settings: Record<string, number> = {
    deduction_1st: 3,
    deduction_2nd: 2,
    deduction_3rd: 2,
    deduction_front9: 1,
    deduction_back9: 1,
  };
  for (const row of result.rows) {
    settings[row.key as string] = parseInt(row.value as string, 10) || 0;
  }
  return settings;
}

export async function POST(request: Request) {
  try {
    const db = getDb();
    const body = await request.json().catch(() => ({}));
    
    // Get event from body or find current event
    let eventId = body.event_id;
  
  if (!eventId) {
    const inProgressResult = await db.execute("SELECT id FROM events WHERE status = 'in_progress' ORDER BY date DESC LIMIT 1");
    eventId = inProgressResult.rows[0]?.id as string;

    if (!eventId) {
      const upcomingResult = await db.execute("SELECT id FROM events WHERE status = 'upcoming' ORDER BY date ASC LIMIT 1");
      eventId = upcomingResult.rows[0]?.id as string;
    }
  }

  if (!eventId) return NextResponse.json({ error: 'No event found' }, { status: 404 });

  // Get event details for type and class settings
  const eventResult = await db.execute({ sql: 'SELECT * FROM events WHERE id = ?', args: [eventId] });
  const event = eventResult.rows[0] as Record<string, unknown> | undefined;
  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

  const eventType = (event.event_type as string) || 'standard';
  const class1MaxHcp = (event.class1_max_handicap as number) || 18;
  const class2MinHcp = (event.class2_min_handicap as number) || 19;

  // Get all submitted scorecards with member type
  const scorecardsResult = await db.execute({
    sql: `
      SELECT s.id, s.member_id, s.event_id, s.total_points, s.total_gross, s.status,
             m.name, m.handicap, m.member_type
      FROM scorecards s JOIN members m ON m.id = s.member_id
      WHERE s.event_id = ? AND s.status = 'submitted'
      ORDER BY s.total_points DESC
    `,
    args: [eventId]
  });
  const scorecards = scorecardsResult.rows as unknown as Array<{
    id: string; member_id: string; total_points: number; total_gross: number;
    name: string; handicap: number; member_type: string; playing_handicap: number;
  }>;

  if (scorecards.length === 0) {
    return NextResponse.json({ error: 'No submitted scorecards' }, { status: 400 });
  }

  const getScores = async (scorecardId: string) => {
    const result = await db.execute({
      sql: 'SELECT hole_number, stableford_points, gross_score FROM hole_scores WHERE scorecard_id = ? ORDER BY hole_number',
      args: [scorecardId]
    });
    return result.rows as unknown as Array<{ hole_number: number; stableford_points: number; gross_score: number }>;
  };

  // Get scores for all players and calculate front 9 / back 9
  const scorecardsWithScores = await Promise.all(scorecards.map(async (scorecard) => {
    const scores = await getScores(scorecard.id);
    const front9 = scores.filter(s => s.hole_number <= 9).reduce((sum, s) => sum + s.stableford_points, 0);
    const back9 = scores.filter(s => s.hole_number >= 10).reduce((sum, s) => sum + s.stableford_points, 0);
    return { ...scorecard, scores, front9, back9 };
  }));

  // Get event number to determine which deductions apply
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

  // Filter out visitors - they can play but cannot win prizes
  console.log('🔍 DEBUG: All scorecards BEFORE filter:', JSON.stringify(scorecardsWithScores.map(sc => ({
    name: sc.name,
    member_type: sc.member_type,
    member_type_check: sc.member_type !== 'visitor',
    points: sc.total_points
  }))));
  const eligibleForPrizes = scorecardsWithScores.filter(sc => sc.member_type !== 'visitor');
  console.log('🔍 DEBUG: Eligible for prizes AFTER filter:', JSON.stringify(eligibleForPrizes.map(sc => ({
    name: sc.name,
    member_type: sc.member_type,
    points: sc.total_points
  }))));
  console.log(`🔍 DEBUG: Filtered ${scorecardsWithScores.length - eligibleForPrizes.length} visitors from ${scorecardsWithScores.length} total`);

  // Add adjusted points for overall ranking (deductions applied)
  const withAdjusted = eligibleForPrizes.map(sc => {
    const surname = sc.name.trim().split(' ').slice(-1)[0].toLowerCase();
    const fullName = sc.name.trim().toLowerCase();
    const deduction = deductionMap.get(fullName) || 0;
    return { ...sc, adjusted_points: sc.total_points + deduction, deduction };
  });

  // Sort by ADJUSTED points for overall prizes
  const sorted = [...withAdjusted].sort((a, b) => {
    if (a.adjusted_points !== b.adjusted_points) return b.adjusted_points - a.adjusted_points;
    return countbackCompare(a.scores, b.scores).result;
  });

  // Clear existing prize allocations
  await db.execute({ sql: 'DELETE FROM prize_allocations WHERE event_id = ?', args: [eventId] });

  // Track winners to exclude from other prizes
  const winnerIds: string[] = [];

  if (eventType === 'standard') {
    // STANDARD EVENT PRIZES
    // Overall: 1st €80, 2nd €60, 3rd €40
    const overallPrizes = [80, 60, 40];
    for (let i = 0; i < Math.min(3, sorted.length); i++) {
      let countbackNote = '';
      if (i > 0 && sorted[i].adjusted_points === sorted[i - 1].adjusted_points) {
        const result = countbackCompare(sorted[i - 1].scores, sorted[i].scores);
        countbackNote = result.note;
      }
      await db.execute({
        sql: 'INSERT INTO prize_allocations (id, event_id, member_id, prize_type, position, label, value, countback_note) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        args: [uuidv4(), eventId, sorted[i].member_id, 'overall', i + 1,
          `${['🥇 1st', '🥈 2nd', '🥉 3rd'][i]} — ${sorted[i].name} (${sorted[i].adjusted_points} pts)`,
          overallPrizes[i], countbackNote || null]
      });
      winnerIds.push(sorted[i].member_id);
    }

    // Front 9 winner (€25) - excluding overall winners, using ADJUSTED front 9 scores
    const front9Sorted = [...withAdjusted]
      .filter(s => !winnerIds.includes(s.member_id))
      .sort((a, b) => {
        const aAdj = a.front9 + a.deduction;
        const bAdj = b.front9 + b.deduction;
        if (aAdj !== bAdj) return bAdj - aAdj;
        const aFront = a.scores.filter(s => s.hole_number <= 9);
        const bFront = b.scores.filter(s => s.hole_number <= 9);
        return countbackCompare(aFront, bFront, 9).result;
      });
    
    if (front9Sorted.length > 0) {
      const adjF9 = front9Sorted[0].front9 + front9Sorted[0].deduction;
      await db.execute({
        sql: 'INSERT INTO prize_allocations (id, event_id, member_id, prize_type, position, label, value, countback_note) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        args: [uuidv4(), eventId, front9Sorted[0].member_id, 'front_9', 1,
          `⛳ Front 9 — ${front9Sorted[0].name} (${adjF9} pts)`,
          25, null]
      });
      winnerIds.push(front9Sorted[0].member_id);
    }

    // Back 9 winner (€25) - excluding overall and front 9 winners, using ADJUSTED back 9 scores
    const back9Sorted = [...withAdjusted]
      .filter(s => !winnerIds.includes(s.member_id))
      .sort((a, b) => {
        const aAdj = a.back9 + a.deduction;
        const bAdj = b.back9 + b.deduction;
        if (aAdj !== bAdj) return bAdj - aAdj;
        const aBack = a.scores.filter(s => s.hole_number >= 10);
        const bBack = b.scores.filter(s => s.hole_number >= 10);
        return countbackCompare(aBack, bBack, 9).result;
      });
    
    if (back9Sorted.length > 0) {
      const adjB9 = back9Sorted[0].back9 + back9Sorted[0].deduction;
      await db.execute({
        sql: 'INSERT INTO prize_allocations (id, event_id, member_id, prize_type, position, label, value, countback_note) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        args: [uuidv4(), eventId, back9Sorted[0].member_id, 'back_9', 1,
          `⛳ Back 9 — ${back9Sorted[0].name} (${adjB9} pts)`,
          25, null]
      });
    }

  } else {
    // CAPTAIN'S / PRESIDENT'S PRIZE - Special Rules
    // Prize sequence:
    // 1. 1st Overall (RAW points only - no adjustments)
    // 2. 2nd Overall (adjusted points)
    // 3. Class 1 - 1st & 2nd (adjusted points, excluding overall winners)
    // 4. Class 2 - 1st & 2nd (adjusted points, excluding overall winners)
    // 5. 3rd Overall (adjusted points, excluding all prior winners)
    // Deductions for NEXT event: Winner -3, 2nd/3rd/Class winners -2
    // GOTY: Always raw points (no adjustments)

    // 1. Overall 1st (RAW POINTS ONLY - Captain's Prize special rule)
    // Sort by raw points (total_points) NOT adjusted_points
    const sortedByRaw = [...withAdjusted].sort((a, b) => {
      if (a.total_points !== b.total_points) return b.total_points - a.total_points;
      return countbackCompare(a.scores, b.scores).result;
    });
    
    if (sortedByRaw.length > 0) {
      let countbackNote = '';
      if (sortedByRaw.length > 1 && sortedByRaw[0].total_points === sortedByRaw[1].total_points) {
        const result = countbackCompare(sortedByRaw[0].scores, sortedByRaw[1].scores);
        countbackNote = result.note;
      }
      await db.execute({
        sql: 'INSERT INTO prize_allocations (id, event_id, member_id, prize_type, position, label, value, countback_note) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        args: [uuidv4(), eventId, sortedByRaw[0].member_id, 'overall', 1,
          `🥇 1st Overall — ${sortedByRaw[0].name} (${sortedByRaw[0].total_points} pts)`,
          0, countbackNote || null]
      });
      winnerIds.push(sortedByRaw[0].member_id);
    }

    // 2. Overall 2nd (all players, adjusted points with deductions)
    if (sorted.length > 1) {
      let countbackNote = '';
      if (sorted.length > 2 && sorted[1].adjusted_points === sorted[2].adjusted_points) {
        const result = countbackCompare(sorted[1].scores, sorted[2].scores);
        countbackNote = result.note;
      }
      await db.execute({
        sql: 'INSERT INTO prize_allocations (id, event_id, member_id, prize_type, position, label, value, countback_note) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        args: [uuidv4(), eventId, sorted[1].member_id, 'overall', 2,
          `🥈 2nd Overall — ${sorted[1].name} (${sorted[1].adjusted_points} pts)`,
          0, countbackNote || null]
      });
      winnerIds.push(sorted[1].member_id);
    }

    // 3. Class 1 - 1st & 2nd (H/C ≤ class1_max_handicap, excluding overall winners)
    const class1Players = sorted.filter(s => s.handicap <= class1MaxHcp && !winnerIds.includes(s.member_id));
    
    if (class1Players.length > 0) {
      let countbackNote = '';
      if (class1Players.length > 1 && class1Players[0].adjusted_points === class1Players[1].adjusted_points) {
        const result = countbackCompare(class1Players[0].scores, class1Players[1].scores);
        countbackNote = result.note;
      }
      await db.execute({
        sql: 'INSERT INTO prize_allocations (id, event_id, member_id, prize_type, position, label, value, countback_note) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        args: [uuidv4(), eventId, class1Players[0].member_id, 'class_1', 1,
          `🏅 Class 1 - 1st (H/C ≤${class1MaxHcp}) — ${class1Players[0].name} (${class1Players[0].adjusted_points} pts)`,
          0, countbackNote || null]
      });
      winnerIds.push(class1Players[0].member_id);
    }

    if (class1Players.length > 1) {
      let countbackNote = '';
      if (class1Players.length > 2 && class1Players[1].adjusted_points === class1Players[2].adjusted_points) {
        const result = countbackCompare(class1Players[1].scores, class1Players[2].scores);
        countbackNote = result.note;
      }
      await db.execute({
        sql: 'INSERT INTO prize_allocations (id, event_id, member_id, prize_type, position, label, value, countback_note) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        args: [uuidv4(), eventId, class1Players[1].member_id, 'class_1', 2,
          `🏅 Class 1 - 2nd (H/C ≤${class1MaxHcp}) — ${class1Players[1].name} (${class1Players[1].adjusted_points} pts)`,
          0, countbackNote || null]
      });
      winnerIds.push(class1Players[1].member_id);
    }

    // 4. Class 2 - 1st & 2nd (H/C ≥ class2_min_handicap, excluding overall winners)
    const class2Players = sorted.filter(s => s.handicap >= class2MinHcp && !winnerIds.includes(s.member_id));
    
    if (class2Players.length > 0) {
      let countbackNote = '';
      if (class2Players.length > 1 && class2Players[0].adjusted_points === class2Players[1].adjusted_points) {
        const result = countbackCompare(class2Players[0].scores, class2Players[1].scores);
        countbackNote = result.note;
      }
      await db.execute({
        sql: 'INSERT INTO prize_allocations (id, event_id, member_id, prize_type, position, label, value, countback_note) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        args: [uuidv4(), eventId, class2Players[0].member_id, 'class_2', 1,
          `🏅 Class 2 - 1st (H/C ≥${class2MinHcp}) — ${class2Players[0].name} (${class2Players[0].adjusted_points} pts)`,
          0, countbackNote || null]
      });
      winnerIds.push(class2Players[0].member_id);
    }

    if (class2Players.length > 1) {
      let countbackNote = '';
      if (class2Players.length > 2 && class2Players[1].adjusted_points === class2Players[2].adjusted_points) {
        const result = countbackCompare(class2Players[1].scores, class2Players[2].scores);
        countbackNote = result.note;
      }
      await db.execute({
        sql: 'INSERT INTO prize_allocations (id, event_id, member_id, prize_type, position, label, value, countback_note) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        args: [uuidv4(), eventId, class2Players[1].member_id, 'class_2', 2,
          `🏅 Class 2 - 2nd (H/C ≥${class2MinHcp}) — ${class2Players[1].name} (${class2Players[1].adjusted_points} pts)`,
          0, countbackNote || null]
      });
      winnerIds.push(class2Players[1].member_id);
    }

    // 5. 3rd Overall (all players, excluding all prior winners)
    const third = sorted.filter(s => !winnerIds.includes(s.member_id));
    if (third.length > 0) {
      let countbackNote = '';
      if (third.length > 1 && third[0].adjusted_points === third[1].adjusted_points) {
        const result = countbackCompare(third[0].scores, third[1].scores);
        countbackNote = result.note;
      }
      await db.execute({
        sql: 'INSERT INTO prize_allocations (id, event_id, member_id, prize_type, position, label, value, countback_note) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        args: [uuidv4(), eventId, third[0].member_id, 'third_overall', 1,
          `🥉 3rd Overall — ${third[0].name} (${third[0].adjusted_points} pts)`,
          0, countbackNote || null]
      });
      winnerIds.push(third[0].member_id);
    }

    // Captain's Prize does NOT have Front 9 / Back 9 prizes
    // (Those are only for Standard events)
  }

  // Auto-detect Twos from scorecards (gross score = 2)
  console.log(`🔍 Searching for Twos (gross_score = 2) in event ${eventId}...`);
  const twosResult = await db.execute({
    sql: `
      SELECT hs.hole_number, sc.member_id, m.name
      FROM hole_scores hs
      JOIN scorecards sc ON hs.scorecard_id = sc.id
      JOIN members m ON sc.member_id = m.id
      WHERE sc.event_id = ? AND hs.gross_score = 2 AND sc.status = 'submitted'
      ORDER BY hs.hole_number, m.name
    `,
    args: [eventId]
  });
  
  console.log(`🎯 Found ${twosResult.rows.length} Twos`);
  
  // Clear existing Twos from side_comps and add fresh ones
  await db.execute({
    sql: "DELETE FROM side_comps WHERE event_id = ? AND type = 'twos'",
    args: [eventId]
  });
  
  for (const two of twosResult.rows) {
    await db.execute({
      sql: 'INSERT INTO side_comps (id, event_id, member_id, type, hole_number, value, unit) VALUES (?, ?, ?, ?, ?, ?, ?)',
      args: [uuidv4(), eventId, two.member_id, 'twos', two.hole_number, 0, '']
    });
    console.log(`  ✓ Added Two: ${two.name} on hole ${two.hole_number}`);
  }

  // Side comps (NTP, Longest Drive, Twos)
  const sideCompsResult = await db.execute({
    sql: 'SELECT sc.*, m.name FROM side_comps sc JOIN members m ON m.id = sc.member_id WHERE sc.event_id = ?',
    args: [eventId]
  });
  const sideComps = sideCompsResult.rows as unknown as Array<{
    type: string; hole_number: number; member_id: string; value: number; unit: string; name: string;
  }>;

  for (const sc of sideComps) {
    if (sc.type === 'ntp') {
      await db.execute({
        sql: 'INSERT INTO prize_allocations (id, event_id, member_id, prize_type, position, label, value, countback_note) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        args: [uuidv4(), eventId, sc.member_id, 'ntp', null,
          `🎯 Nearest the Pin — Hole ${sc.hole_number} — ${sc.name} (${sc.value} ${sc.unit})`,
          0, null]
      });
    } else if (sc.type === 'longest_drive') {
      await db.execute({
        sql: 'INSERT INTO prize_allocations (id, event_id, member_id, prize_type, position, label, value, countback_note) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        args: [uuidv4(), eventId, sc.member_id, 'longest_drive', null,
          `💥 Longest Drive — Hole ${sc.hole_number} — ${sc.name}`,
          0, null]
      });
    } else if (sc.type === 'twos') {
      await db.execute({
        sql: 'INSERT INTO prize_allocations (id, event_id, member_id, prize_type, position, label, value, countback_note) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        args: [uuidv4(), eventId, sc.member_id, 'twos', null,
          `🏆 Two — Hole ${sc.hole_number} — ${sc.name}`,
          0, null]
      });
    } else if (sc.type === 'visitors') {
      await db.execute({
        sql: 'INSERT INTO prize_allocations (id, event_id, member_id, prize_type, position, label, value, countback_note) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        args: [uuidv4(), eventId, sc.member_id, 'visitors', null,
          `🏍️ Visitors Prize — ${sc.name} (${sc.value} pts)`,
          0, null]
      });
    }
  }

  // Update GOTY (Order of Merit) - store actual Stableford points for best 6 of 8 calculation
  await db.execute({ sql: 'DELETE FROM goty_points WHERE event_id = ?', args: [eventId] });
  
  const season = new Date().getFullYear().toString();
  
  // Store every player's Stableford score (visitors already excluded)
  for (let i = 0; i < sorted.length; i++) {
    await db.execute({
      sql: 'INSERT INTO goty_points (id, member_id, event_id, position, points, season) VALUES (?, ?, ?, ?, ?, ?)',
      args: [uuidv4(), sorted[i].member_id, eventId, `${i + 1}`, sorted[i].total_points, season] // RAW points for GOTY
    });
  }

  // Apply handicap deductions for prize winners
  const deductions = await getDeductionSettings(db);
  const handicapUpdates: Array<{ memberId: string; deduction: number; reason: string }> = [];

  // Get all prize allocations for this event
  const prizesResult = await db.execute({
    sql: 'SELECT member_id, prize_type, position FROM prize_allocations WHERE event_id = ?',
    args: [eventId]
  });

  for (const prize of prizesResult.rows) {
    const memberId = prize.member_id as string;
    const prizeType = prize.prize_type as string;
    const position = prize.position as number | null;
    let deduction = 0;
    let reason = '';

    if (eventType === 'captains' || eventType === 'presidents') {
      // CAPTAIN'S/PRESIDENT'S PRIZE: NO DEDUCTIONS APPLIED
      // Winners are exempt from handicap deductions per ALGS rules
      deduction = 0;
      reason = '';
    } else {
      // STANDARD EVENT DEDUCTIONS (from society settings)
      if (prizeType === 'overall' || prizeType === 'class_1' || prizeType === 'class_2') {
        if (position === 1) {
          deduction = deductions.deduction_1st;
          reason = '1st Place';
        } else if (position === 2) {
          deduction = deductions.deduction_2nd;
          reason = '2nd Place';
        } else if (position === 3) {
          deduction = deductions.deduction_3rd;
          reason = '3rd Place';
        }
      }
      // Front 9 / Back 9 (Standard events only)
      else if (prizeType === 'front_9' || prizeType === 'class_1_front_9' || prizeType === 'class_2_front_9') {
        deduction = deductions.deduction_front9;
        reason = 'Front 9 Winner';
      }
      else if (prizeType === 'back_9' || prizeType === 'class_1_back_9' || prizeType === 'class_2_back_9') {
        deduction = deductions.deduction_back9;
        reason = 'Back 9 Winner';
      }
    }

    if (deduction > 0) {
      // Check if we already have a deduction for this member (take the highest)
      const existing = handicapUpdates.find(u => u.memberId === memberId);
      if (existing) {
        if (deduction > existing.deduction) {
          existing.deduction = deduction;
          existing.reason = reason;
        }
      } else {
        handicapUpdates.push({ memberId, deduction, reason });
      }
    }
  }

  // Log deductions but DO NOT mutate members.handicap
  // Deductions are tracked in member_deductions table and applied at scoring/display time
  for (const update of handicapUpdates) {
    // Log the deduction for audit trail only
    await db.execute({
      sql: 'INSERT INTO activity_log (id, event_id, member_id, action, detail, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      args: [uuidv4(), eventId, update.memberId, 'handicap_deduction', 
        `Deduction of ${update.deduction} shots (${update.reason}) — tracked in deductions sheet`, new Date().toISOString()]
    });
  }

  // Auto-write deductions to member_deductions table for this outing
  const outingCol = `outing_${eventNumber}`;
  const year = new Date().getFullYear();
  
  // Get all members who played in this event
  const playedResult = await db.execute({
    sql: `SELECT DISTINCT m.id, m.name FROM scorecards sc JOIN members m ON m.id = sc.member_id
          WHERE sc.event_id = ? AND sc.status = 'submitted' AND m.member_type != 'visitor'`,
    args: [eventId]
  });
  const playedMembers = playedResult.rows as unknown as Array<{id: string; name: string}>;
  
  // Build a map of member_id -> deduction for this outing from prize winners
  const outingDeductions = new Map<string, number>();
  
  // Prize winners get negative deductions
  for (const update of handicapUpdates) {
    outingDeductions.set(update.memberId, -update.deduction);
  }
  
  // Everyone who played but didn't win gets +1 (earned back) - BUT ONLY if they have negative cumulative deductions
  // RULE: Deductions range from negative to 0. Zero is the floor. Nobody can go below 0 (no +1, +2, etc.)
  for (const member of playedMembers) {
    if (!outingDeductions.has(member.id)) {
      // Get member's current cumulative deduction (up to but not including this event)
      const memberFullName = member.name.trim().toLowerCase();
      const surname = member.name.trim().split(' ').slice(-1)[0].toLowerCase();
      const currentDeduction = deductionMap.get(memberFullName) || deductionMap.get(surname) || 0;
      
      // Only give +1 if they're currently negative (e.g., -1, -2, -3)
      // This prevents them from going into positive territory
      // 0 is the floor - players at 0 stay at 0
      if (currentDeduction < 0) {
        outingDeductions.set(member.id, 1);
      } else {
        // At 0 or somehow positive → give 0 (stay at 0)
        outingDeductions.set(member.id, 0);
      }
    }
  }
  
  // Load all existing deduction rows for this year
  const allDeductionRows = await db.execute({
    sql: 'SELECT id, member_name, first_name FROM member_deductions WHERE year = ?',
    args: [year]
  });
  // Build lookup map: lowercase full name -> row id
  const deductionRowMap = new Map<string, string>();
  for (const row of allDeductionRows.rows) {
    const fn = ((row.first_name as string) || '').trim();
    const mn = ((row.member_name as string) || '').trim();
    const fullName = `${fn} ${mn}`.trim().toLowerCase();
    deductionRowMap.set(fullName, row.id as string);
  }

  // Write to member_deductions table
  for (const [memberId, deduction] of outingDeductions) {
    const member = playedMembers.find(m => m.id === memberId);
    if (!member) continue;
    const memberFullName = member.name.trim().toLowerCase();
    const existingRowId = deductionRowMap.get(memberFullName);
    
    if (existingRowId) {
      await db.execute({
        sql: `UPDATE member_deductions SET ${outingCol} = ? WHERE id = ?`,
        args: [deduction, existingRowId]
      });
    } else {
      // Create new row
      const surname = member.name.trim().split(' ').slice(-1)[0];
      const firstName = member.name.trim().split(' ').slice(0, -1).join(' ');
      const newId = uuidv4();
      await db.execute({
        sql: `INSERT INTO member_deductions (id, member_name, first_name, year, ${outingCol}) VALUES (?, ?, ?, ?, ?)`,
        args: [newId, surname, firstName, year, deduction]
      });
    }
  }

  // Update event status
  await db.execute({
    sql: "UPDATE events SET status = 'finalised', results_published = 0 WHERE id = ?",
    args: [eventId]
  });

  const deductionSummary = handicapUpdates.length > 0 
    ? ` ${handicapUpdates.length} handicap deduction(s) applied.`
    : '';

    return NextResponse.json({ 
      success: true, 
      message: `Results finalised!${deductionSummary}`,
      handicap_deductions: handicapUpdates
    });
  } catch (error) {
    console.error('❌ Finalise error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('Error details:', { message: errorMessage, stack: errorStack });
    return NextResponse.json({ 
      error: 'Failed to finalise event',
      details: errorMessage 
    }, { status: 500 });
  }
}
