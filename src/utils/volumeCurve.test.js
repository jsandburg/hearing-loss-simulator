import { describe, it, expect } from 'vitest';
import { percentToGain } from './volumeCurve.js';

describe('percentToGain', () => {
  it('returns 0 at 0%', () => {
    expect(percentToGain(0)).toBe(0);
  });

  it('returns 1 at 100%', () => {
    expect(percentToGain(100)).toBe(1);
  });

  it('returns 0.25 at 50% (x² curve)', () => {
    expect(percentToGain(50)).toBeCloseTo(0.25);
  });

  it('returns 0.5625 at 75%', () => {
    expect(percentToGain(75)).toBeCloseTo(0.5625);
  });

  it('clamps to 0 below range', () => {
    expect(percentToGain(-10)).toBe(0);
  });

  it('clamps to 1 above range', () => {
    expect(percentToGain(110)).toBe(1);
  });

  it('is monotonically increasing', () => {
    const values = [0, 10, 25, 50, 75, 90, 100].map(percentToGain);
    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeGreaterThanOrEqual(values[i - 1]);
    }
  });
});
