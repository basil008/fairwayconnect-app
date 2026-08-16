/**
 * WHS Course Settings for calculating playing handicap
 */
export interface WHSCourseSettings {
  slopeRating: number;      // Course slope (typically 55-155, neutral = 113)
  courseRating: number;     // Course rating
  coursePar: number;        // Course par
  handicapAllowance: number; // Competition allowance (e.g., 0.95 for 95%)
}

/**
 * Calculate WHS Playing Handicap from Handicap Index
 * Formula: Playing H/C = ROUND(((Index × Slope ÷ 113) + (CR − Par)) × Allowance)
 * CRITICAL: Allowance must be applied BEFORE rounding!
 */
export function calculatePlayingHandicap(
  handicapIndex: number,
  courseSettings?: WHSCourseSettings
): number {
  if (!courseSettings) {
    // Fallback: just round the index (no WHS adjustment)
    return Math.round(handicapIndex);
  }
  
  const slope = Number(courseSettings.slopeRating) || 113;
  const cr = Number(courseSettings.courseRating) || 72;
  const par = Number(courseSettings.coursePar) || 72;
  const allowance = Number(courseSettings.handicapAllowance) || 0.95;
  
  // Calculate course handicap WITHOUT rounding
  const courseHC = (Number(handicapIndex) * slope / 113) + (cr - par);
  
  // Apply allowance THEN round (correct WHS formula)
  const playingHC = Math.round(courseHC * allowance);
  
  return playingHC;
}

/**
 * Calculate Stableford points for a hole
 * @param grossScore - the actual strokes taken
 * @param par - par for the hole
 * @param strokeIndex - stroke index for the hole (1-18)
 * @param playerHandicap - player's handicap index
 * @param courseSettings - optional WHS course settings for proper playing handicap calculation
 * @returns Stableford points for the hole
 */
export function calculateStablefordPoints(
  grossScore: number,
  par: number,
  strokeIndex: number,
  playerHandicap: number,
  courseSettings?: WHSCourseSettings
): number {
  // Calculate playing handicap (with or without WHS adjustment)
  const playingHandicap = calculatePlayingHandicap(playerHandicap, courseSettings);
  
  // Calculate strokes received on this hole
  // Using handicap >= strokeIndex for stroke allocation (standard golf rules)
  // If handicap >= strokeIndex, get 1 shot
  // If handicap >= strokeIndex + 18, get 2 shots (for handicaps 19+)
  let strokesReceived = 0;
  if (playingHandicap >= strokeIndex) strokesReceived++;
  if (playingHandicap >= strokeIndex + 18) strokesReceived++;

  const netScore = grossScore - strokesReceived;
  const diff = netScore - par;

  // Stableford: 0 = double bogey+, 1 = bogey, 2 = par, 3 = birdie, 4 = eagle, 5 = albatross
  const points = Math.max(0, 2 - diff);
  return points;
}

/**
 * ALGS Standard Countback Tiebreaker
 * Order: Back 9 → Back 6 → Gross Score (lower is better)
 * Returns negative if a should be ranked higher (better), positive if b should be higher
 */
export function countbackCompare(
  aScores: { hole_number: number; stableford_points: number; gross_score?: number }[],
  bScores: { hole_number: number; stableford_points: number; gross_score?: number }[],
  totalHoles: number = 18
): { result: number; note: string } {
  const getPoints = (scores: typeof aScores, from: number, to: number) =>
    scores.filter(s => s.hole_number >= from && s.hole_number <= to)
      .reduce((sum, s) => sum + s.stableford_points, 0);

  const getGross = (scores: typeof aScores) =>
    scores.reduce((sum, s) => sum + (s.gross_score || 0), 0);

  // 1. Back 9 (holes 10-18)
  const aBack9 = getPoints(aScores, 10, 18);
  const bBack9 = getPoints(bScores, 10, 18);
  if (aBack9 !== bBack9) return { result: bBack9 - aBack9, note: `Back 9: ${aBack9} vs ${bBack9}` };

  // 2. Back 6 (holes 13-18)
  const aBack6 = getPoints(aScores, 13, 18);
  const bBack6 = getPoints(bScores, 13, 18);
  if (aBack6 !== bBack6) return { result: bBack6 - aBack6, note: `Back 6: ${aBack6} vs ${bBack6}` };

  // 3. Gross Score (lower is better)
  const aGross = getGross(aScores);
  const bGross = getGross(bScores);
  if (aGross !== bGross) return { result: aGross - bGross, note: `Gross: ${aGross} vs ${bGross}` };

  return { result: 0, note: 'Tied after full countback' };
}
