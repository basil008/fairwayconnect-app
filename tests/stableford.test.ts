import { describe, it, expect } from 'vitest';
import {
  calculatePlayingHandicap,
  calculateStablefordPoints,
  type WHSCourseSettings,
} from '../src/lib/stableford';

const course = (
  slope: number,
  cr: number,
  par: number,
  allowance: number
): WHSCourseSettings => ({
  slopeRating: slope,
  courseRating: cr,
  coursePar: par,
  handicapAllowance: allowance,
});

describe('calculatePlayingHandicap (WHS)', () => {
  it('falls back to rounded index without course settings', () => {
    expect(calculatePlayingHandicap(20.4)).toBe(20);
    expect(calculatePlayingHandicap(20.5)).toBe(21);
    expect(calculatePlayingHandicap(0)).toBe(0);
  });

  it('neutral course (slope 113, CR = par, 100%) returns rounded index', () => {
    expect(calculatePlayingHandicap(18.0, course(113, 72, 72, 1))).toBe(18);
    expect(calculatePlayingHandicap(18.4, course(113, 72, 72, 1))).toBe(18);
  });

  it('applies slope adjustment', () => {
    // 20.0 × 130/113 = 23.008... → ×0.95 = 21.86 → 22
    expect(calculatePlayingHandicap(20.0, course(130, 72, 72, 0.95))).toBe(22);
  });

  it('applies CR − Par adjustment', () => {
    // 10 × 113/113 = 10; + (74 − 72) = 12; ×1.0 = 12
    expect(calculatePlayingHandicap(10, course(113, 74, 72, 1))).toBe(12);
  });

  it('REGRESSION: allowance is applied BEFORE rounding (July 2026 fix)', () => {
    // index 15.0, slope 113, CR=par, allowance 0.95:
    //   correct:  15 × 0.95 = 14.25 → 14
    //   old bug:  round(15) = 15 → 15 × 0.95 = 14.25 → would round the
    //             course handicap first and could differ at boundaries.
    expect(calculatePlayingHandicap(15.0, course(113, 72, 72, 0.95))).toBe(14);

    // Boundary case that exposes the ordering:
    // index 18.4 slope 120: courseHC = 18.4×120/113 = 19.539
    //   correct: 19.539 × 0.95 = 18.56 → 19
    //   wrong (round first): round(19.539)=20 → ×0.95 = 19 → same here, so
    // use one where it differs:
    // index 17.2 slope 125: courseHC = 19.027; ×0.95 = 18.08 → 18
    //   wrong: round(19.027)=19 → 19×0.95=18.05 → 18 (same)
    // index 18.9 slope 113: courseHC = 18.9; ×0.95 = 17.955 → 18
    //   wrong: round(18.9)=19; 19×0.95=18.05 → 18 (same)
    // index 19.5 slope 113: courseHC 19.5 ×0.95 = 18.525 → 19
    //   wrong: round(19.5)=20 → 20×0.95=19 → 19 (same)
    // The clean discriminating case: rounding the ALLOWED value only once.
    // 21.6 slope 113 allowance 0.9: 21.6×0.9 = 19.44 → 19
    //   wrong (allowance after round): round(21.6)=22 → 22×0.9=19.8 → 20
    expect(calculatePlayingHandicap(21.6, course(113, 72, 72, 0.9))).toBe(19);
  });

  it('handles invalid/missing values with sane defaults', () => {
    expect(
      calculatePlayingHandicap(10, {
        slopeRating: NaN as unknown as number,
        courseRating: NaN as unknown as number,
        coursePar: NaN as unknown as number,
        handicapAllowance: NaN as unknown as number,
      })
    ).toBe(10); // 10×113/113 + (72−72) = 10 → ×0.95 = 9.5 → rounds to 10 (banker's? Math.round(9.5)=10)
  });
});

describe('calculateStablefordPoints', () => {
  // Playing handicap 18 on a neutral course: one stroke on every hole
  const neutral = course(113, 72, 72, 1);

  it('applies the received stroke before scoring (net vs par)', () => {
    // par 4, SI 10, playing handicap 18 → 1 stroke → net = gross − 1
    // points = max(0, 2 − (net − par))
    const pts = (gross: number) =>
      calculateStablefordPoints(gross, 4, 10, 18, neutral);
    expect(pts(3)).toBe(4); // net 2 → −2 vs par → 4 pts (net eagle)
    expect(pts(4)).toBe(3); // net 3 → −1 → 3 pts (net birdie)
    expect(pts(5)).toBe(2); // net 4 →  0 → 2 pts (net par)
    expect(pts(6)).toBe(1); // net 5 → +1 → 1 pt  (net bogey)
    expect(pts(7)).toBe(0); // net 6 → +2 → 0 pts
  });

  it('exact points ladder for a scratch player (no strokes)', () => {
    const pts = (gross: number) =>
      calculateStablefordPoints(gross, 4, 1, 0, neutral);
    expect(pts(2)).toBe(4); // eagle
    expect(pts(3)).toBe(3); // birdie
    expect(pts(4)).toBe(2); // par
    expect(pts(5)).toBe(1); // bogey
    expect(pts(6)).toBe(0); // double bogey
    expect(pts(9)).toBe(0); // never negative
  });

  it('allocates strokes by stroke index', () => {
    // handicap 9: stroke on SI 1..9, none on SI 10..18
    expect(calculateStablefordPoints(5, 4, 9, 9, neutral)).toBe(2);  // net par
    expect(calculateStablefordPoints(5, 4, 10, 9, neutral)).toBe(1); // net bogey
  });

  it('gives two strokes on low SI holes for handicaps over 18', () => {
    // playing handicap 20: 2 strokes on SI 1 and 2, 1 stroke on SI 3..18
    expect(calculateStablefordPoints(6, 4, 1, 20, neutral)).toBe(2);  // net par
    expect(calculateStablefordPoints(6, 4, 3, 20, neutral)).toBe(1);  // net bogey
  });

  it('uses the WHS playing handicap, not the raw index (client/server parity)', () => {
    // index 20.0 at slope 130 / 95% → playing 22 → 2 strokes on SI ≤ 4
    const hilly = course(130, 72, 72, 0.95);
    expect(calculateStablefordPoints(6, 4, 4, 20.0, hilly)).toBe(2); // net par with 2 strokes
    // the old client-side Math.round(20.0)=20 would give only 2 strokes on SI ≤ 2,
    // i.e. 1 stroke here → net bogey → 1 pt. This asserts the unified behaviour.
  });
});
