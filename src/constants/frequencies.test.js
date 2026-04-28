import { describe, it, expect } from 'vitest';
import { getEffectiveQ, FILTER_Q, RETSPL_CORRECTION, FREQUENCIES } from './frequencies.js';

describe('getEffectiveQ', () => {
  it('returns base Q at 0 dB loss (no broadening)', () => {
    FILTER_Q.forEach((q, i) => {
      expect(getEffectiveQ(i, 0)).toBe(q);
    });
  });

  it('returns base Q for negative loss values', () => {
    FILTER_Q.forEach((q, i) => {
      expect(getEffectiveQ(i, -10)).toBe(q);
    });
  });

  it('returns half the base Q at 60 dB loss (2× broadening)', () => {
    FILTER_Q.forEach((q, i) => {
      expect(getEffectiveQ(i, 60)).toBeCloseTo(q / 2, 10);
    });
  });

  it('returns base Q / 1.5 at 30 dB loss', () => {
    // broadeningFactor = 1 + 30/60 = 1.5
    FILTER_Q.forEach((q, i) => {
      expect(getEffectiveQ(i, 30)).toBeCloseTo(q / 1.5, 10);
    });
  });

  it('caps broadening at 60 dB — loss beyond 60 dB does not reduce Q further', () => {
    FILTER_Q.forEach((q, i) => {
      const at60  = getEffectiveQ(i, 60);
      const at90  = getEffectiveQ(i, 90);
      const at120 = getEffectiveQ(i, 120);
      expect(at90).toBeCloseTo(at60, 10);
      expect(at120).toBeCloseTo(at60, 10);
    });
  });

  it('is monotonically decreasing as loss increases from 0 to 60', () => {
    [0, 1, 2, 3].forEach(bandIndex => {
      const values = [0, 10, 20, 30, 40, 50, 60].map(db => getEffectiveQ(bandIndex, db));
      for (let i = 1; i < values.length; i++) {
        expect(values[i]).toBeLessThan(values[i - 1]);
      }
    });
  });

  it('always returns a positive Q value', () => {
    [0, 10, 30, 60, 120].forEach(db => {
      FILTER_Q.forEach((_, i) => {
        expect(getEffectiveQ(i, db)).toBeGreaterThan(0);
      });
    });
  });
});

describe('RETSPL_CORRECTION', () => {
  it('has one correction value per audiogram frequency', () => {
    expect(RETSPL_CORRECTION).toHaveLength(FREQUENCIES.length);
  });

  it('all values are positive (SPL is always higher than HL at threshold)', () => {
    RETSPL_CORRECTION.forEach(v => expect(v).toBeGreaterThan(0));
  });

  it('250 Hz correction (25.5 dB) is the largest — low frequencies need most correction', () => {
    const max = Math.max(...RETSPL_CORRECTION);
    expect(RETSPL_CORRECTION[0]).toBe(max);
  });
});
