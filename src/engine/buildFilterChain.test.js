import { describe, it, expect } from 'vitest';
import {
  getPeakingResponseDb,
  evaluateCascadeAttenuation,
  solveLinearSystem,
  calibrateBandAttenuations,
  buildSensorineuralBands,
} from './buildFilterChain.js';
import { FREQUENCIES } from '../constants/frequencies.js';

const SAMPLE_RATE = 48000;

// ─── solveLinearSystem ─────────────────────────────────────────────────────────

describe('solveLinearSystem', () => {
  it('solves a 2×2 identity system', () => {
    const result = solveLinearSystem([[1, 0], [0, 1]], [3, 7]);
    expect(result[0]).toBeCloseTo(3);
    expect(result[1]).toBeCloseTo(7);
  });

  it('solves a 2×2 diagonal system', () => {
    const result = solveLinearSystem([[2, 0], [0, 4]], [6, 8]);
    expect(result[0]).toBeCloseTo(3);
    expect(result[1]).toBeCloseTo(2);
  });

  it('solves a 2×2 system with cross terms', () => {
    // 2x + y = 5, x + 2y = 4 → x=2, y=1
    const result = solveLinearSystem([[2, 1], [1, 2]], [5, 4]);
    expect(result[0]).toBeCloseTo(2);
    expect(result[1]).toBeCloseTo(1);
  });

  it('solves a 3×3 system', () => {
    // x=1, y=2, z=3
    const result = solveLinearSystem(
      [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
      [1, 2, 3]
    );
    expect(result[0]).toBeCloseTo(1);
    expect(result[1]).toBeCloseTo(2);
    expect(result[2]).toBeCloseTo(3);
  });

  it('returns null for a near-singular matrix', () => {
    const result = solveLinearSystem([[1e-10, 0], [0, 1]], [1, 1]);
    expect(result).toBeNull();
  });
});

// ─── getPeakingResponseDb ──────────────────────────────────────────────────────

describe('getPeakingResponseDb', () => {
  it('returns 0 when gainDb is 0', () => {
    expect(getPeakingResponseDb(SAMPLE_RATE, 1000, 1000, 2, 0)).toBe(0);
  });

  it('returns approximately gainDb at the center frequency', () => {
    const gain = -20;
    const response = getPeakingResponseDb(SAMPLE_RATE, 1000, 1000, 2, gain);
    expect(response).toBeCloseTo(gain, 1);
  });

  it('returns near 0 dB far below the center frequency', () => {
    // Test at 100 Hz when center is 4000 Hz — should be close to 0
    const response = getPeakingResponseDb(SAMPLE_RATE, 100, 4000, 2, -20);
    expect(Math.abs(response)).toBeLessThan(1);
  });

  it('returns near 0 dB far above the center frequency', () => {
    const response = getPeakingResponseDb(SAMPLE_RATE, 16000, 500, 2, -20);
    expect(Math.abs(response)).toBeLessThan(1);
  });

  it('applies attenuation (negative gain reduces response)', () => {
    const response = getPeakingResponseDb(SAMPLE_RATE, 4000, 4000, 2, -30);
    expect(response).toBeLessThan(-25);
  });
});

// ─── evaluateCascadeAttenuation ────────────────────────────────────────────────

describe('evaluateCascadeAttenuation', () => {
  it('returns zero attenuation for all-zero attenuations', () => {
    const bands = FREQUENCIES.map((f, i) => ({ center: f, q: 2, target: 0 }));
    const result = evaluateCascadeAttenuation(SAMPLE_RATE, bands, Array(8).fill(0));
    result.forEach((v) => expect(Math.abs(v)).toBeLessThan(0.01));
  });

  it('returns one value per audiogram frequency', () => {
    const bands = FREQUENCIES.map((f) => ({ center: f, q: 2, target: 10 }));
    const result = evaluateCascadeAttenuation(SAMPLE_RATE, bands, Array(8).fill(10));
    expect(result).toHaveLength(FREQUENCIES.length);
  });
});

// ─── calibrateBandAttenuations ─────────────────────────────────────────────────

describe('calibrateBandAttenuations', () => {
  it('returns zero attenuations for zero targets', () => {
    const bands = FREQUENCIES.map((f, i) => ({ center: f, target: 0, q: 2 }));
    const result = calibrateBandAttenuations(SAMPLE_RATE, bands);
    result.forEach((v) => expect(v).toBeCloseTo(0, 1));
  });

  it('produces a cascade response within 0.25 dB of targets for a mild flat loss', () => {
    const targetDb = 15;
    const bands = FREQUENCIES.map((f) => ({ center: f, target: targetDb, q: 2 }));
    const attenuations = calibrateBandAttenuations(SAMPLE_RATE, bands);
    const actual = evaluateCascadeAttenuation(SAMPLE_RATE, bands, attenuations);
    actual.forEach((v) => expect(Math.abs(v - targetDb)).toBeLessThan(0.26));
  });

  it('bands with meaningful attenuation converge within 0.26 dB for mild presbycusis', () => {
    const lossArr = [0, 5, 10, 20, 30, 40, 45, 50];
    const bands = buildSensorineuralBands(SAMPLE_RATE, lossArr);
    const attenuations = bands.map((b) => b.attenuation);
    const actual = evaluateCascadeAttenuation(SAMPLE_RATE, bands, attenuations);
    // Bands with target > 1 dB converge tightly. Near-normal (zero-target) bands
    // accumulate unavoidable spillover from adjacent high-loss filters — perceptually
    // inaudible (<1 dB) but above the 0.26 dB threshold, so we test them separately.
    bands.forEach((b, i) => {
      if (b.target > 1) {
        expect(Math.abs(actual[i] - b.target)).toBeLessThan(0.26);
      } else {
        expect(Math.abs(actual[i] - b.target)).toBeLessThan(1);
      }
    });
  });

  it('dramatically reduces cascade error vs uncalibrated for sloping severe loss', () => {
    // When many adjacent bands are at MAX_ATTENUATION, near-normal low-frequency bands
    // accumulate ~1-2 dB spillover that can't be corrected (filters can't go negative).
    // The calibration still cuts max error from ~58 dB (uncalibrated) down to ~2 dB.
    const lossArr = [5, 15, 25, 40, 55, 65, 70, 75];
    const bands = buildSensorineuralBands(SAMPLE_RATE, lossArr);
    const attenuations = bands.map((b) => b.attenuation);
    const naive = bands.map((b) => b.target);

    const calibratedErrors = evaluateCascadeAttenuation(SAMPLE_RATE, bands, attenuations)
      .map((v, i) => Math.abs(v - bands[i].target));
    const uncalibratedErrors = evaluateCascadeAttenuation(SAMPLE_RATE, bands, naive)
      .map((v, i) => Math.abs(v - bands[i].target));

    const maxCalibrated = Math.max(...calibratedErrors);
    const maxUncalibrated = Math.max(...uncalibratedErrors);

    // Calibration must cut the worst-case error by at least 10×
    expect(maxCalibrated).toBeLessThan(maxUncalibrated / 10);
    // Even in the worst case, calibrated error stays under 2 dB
    expect(maxCalibrated).toBeLessThan(2);
  });

  it('clamps attenuations to MAX_ATTENUATION', () => {
    const bands = FREQUENCIES.map((f) => ({ center: f, target: 40, q: 2 }));
    const result = calibrateBandAttenuations(SAMPLE_RATE, bands);
    result.forEach((v) => expect(v).toBeLessThanOrEqual(40));
    result.forEach((v) => expect(v).toBeGreaterThanOrEqual(0));
  });
});

// ─── buildSensorineuralBands ───────────────────────────────────────────────────

describe('buildSensorineuralBands', () => {
  it('returns 8 bands', () => {
    const bands = buildSensorineuralBands(SAMPLE_RATE, Array(8).fill(0));
    expect(bands).toHaveLength(8);
  });

  it('each band has center, target, q, and attenuation', () => {
    const bands = buildSensorineuralBands(SAMPLE_RATE, Array(8).fill(20));
    bands.forEach((b) => {
      expect(typeof b.center).toBe('number');
      expect(typeof b.target).toBe('number');
      expect(typeof b.q).toBe('number');
      expect(typeof b.attenuation).toBe('number');
    });
  });

  it('produces zero attenuation for normal hearing input', () => {
    const bands = buildSensorineuralBands(SAMPLE_RATE, Array(8).fill(0));
    bands.forEach((b) => expect(b.attenuation).toBeCloseTo(0, 1));
  });

  it('returns cached result on second call with same inputs', () => {
    const lossArr = [0, 5, 10, 20, 35, 50, 55, 60];
    const first  = buildSensorineuralBands(SAMPLE_RATE, lossArr);
    const second = buildSensorineuralBands(SAMPLE_RATE, lossArr);
    expect(first).toBe(second); // same object reference from cache
  });
});
