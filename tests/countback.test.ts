import { describe, it, expect } from 'vitest';
import { countbackCompare } from '../src/lib/stableford';

/** Build an 18-hole score array from per-hole (points, gross) tuples. */
function card(points: number[], gross?: number[]) {
  return points.map((p, i) => ({
    hole_number: i + 1,
    stableford_points: p,
    gross_score: gross ? gross[i] : 4,
  }));
}

const flat = (pts: number) => Array(18).fill(pts);

describe('countbackCompare (ALGS: Back 9 → Back 6 → Gross)', () => {
  it('better back 9 wins (negative result = a ranked higher)', () => {
    const a = card([...flat(2).slice(0, 9), ...Array(9).fill(3)]); // back9 = 27
    const b = card(flat(2)); // back9 = 18
    const r = countbackCompare(a, b);
    expect(r.result).toBeLessThan(0);
    expect(r.note).toContain('Back 9');
  });

  it('falls through to back 6 when back 9s tie', () => {
    // both back9 = 18; a loads points into holes 13–18
    const aPts = [...flat(2).slice(0, 9), 0, 0, 0, 0, 3, 3, 3, 3, 6];
    const bPts = flat(2);
    // a back9 = 0+0+0+0+3+3+3+3+6 = 18 ✓ ; a back6 (13–18) = 3+3+3+3+6... hole13..18 = 0,3,3,3,3,6 = 18? recount below
    const a = card(aPts);
    const b = card(bPts);
    const back9 = (c: ReturnType<typeof card>) =>
      c.filter(s => s.hole_number >= 10).reduce((s, h) => s + h.stableford_points, 0);
    expect(back9(a)).toBe(back9(b)); // precondition: tied on back 9
    const r = countbackCompare(a, b);
    expect(r.note).toContain('Back 6');
    expect(r.result).toBeLessThan(0); // a's back 6 is heavier
  });

  it('falls through to gross when back 9 and back 6 tie (lower gross wins)', () => {
    const a = card(flat(2), Array(18).fill(4)); // gross 72
    const b = card(flat(2), Array(18).fill(5)); // gross 90
    const r = countbackCompare(a, b);
    expect(r.note).toContain('Gross');
    expect(r.result).toBeLessThan(0); // a lower gross → ranked higher
  });

  it('reports a full tie', () => {
    const a = card(flat(2), Array(18).fill(4));
    const b = card(flat(2), Array(18).fill(4));
    const r = countbackCompare(a, b);
    expect(r.result).toBe(0);
    expect(r.note).toContain('Tied');
  });

  it('is antisymmetric: swapping players flips the sign', () => {
    const a = card([...flat(1).slice(0, 9), ...Array(9).fill(3)]);
    const b = card(flat(2));
    const r1 = countbackCompare(a, b).result;
    const r2 = countbackCompare(b, a).result;
    expect(Math.sign(r1)).toBe(-Math.sign(r2));
  });

  it('works for 9-hole segments (front-9 prize countback)', () => {
    const aFront = card(flat(2)).filter(s => s.hole_number <= 9);
    const bFront = card(flat(2)).filter(s => s.hole_number <= 9);
    // holes 1–9 contain no "back 9/back 6" holes → falls to gross
    const r = countbackCompare(aFront, bFront, 9);
    expect(r.result).toBe(0);
  });
});
