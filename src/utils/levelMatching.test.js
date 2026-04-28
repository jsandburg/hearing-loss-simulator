import { describe, it, expect } from 'vitest';
import { getProfileLevelMatchGain } from './levelMatching.js';

const MAX_GAIN_LINEAR = Math.pow(10, 18 / 20); // ~7.94

const normalProfile = {
  bypass: true,
  left:  Array(8).fill(0),
  right: Array(8).fill(0),
};

const mildSensorineural = {
  bypass: false,
  isConductive: false,
  left:  [10, 15, 20, 30, 35, 40, 40, 40],
  right: [10, 15, 20, 30, 35, 40, 40, 40],
};

const conductiveMild = {
  bypass: false,
  isConductive: true,
  flatAttenuationL: 15,
  flatAttenuationR: 15,
};

const conductiveModerate = {
  bypass: false,
  isConductive: true,
  flatAttenuationL: 25,
  flatAttenuationR: 25,
};

const severeSensorineural = {
  bypass: false,
  isConductive: false,
  left:  [55, 60, 65, 70, 75, 80, 85, 85],
  right: [55, 60, 65, 70, 75, 80, 85, 85],
};

describe('getProfileLevelMatchGain', () => {
  it('returns 1 for null input', () => {
    expect(getProfileLevelMatchGain(null)).toBe(1);
  });

  it('returns 1 for a bypass (normal hearing) profile', () => {
    expect(getProfileLevelMatchGain(normalProfile)).toBe(1);
  });

  it('returns gain > 1 for a sensorineural loss profile', () => {
    expect(getProfileLevelMatchGain(mildSensorineural)).toBeGreaterThan(1);
  });

  it('returns correct linear gain for conductive mild (15 dB each ear)', () => {
    const expected = Math.pow(10, 15 / 20);
    expect(getProfileLevelMatchGain(conductiveMild)).toBeCloseTo(expected, 4);
  });

  it('caps at 18 dB for conductive moderate (25 dB each ear exceeds cap)', () => {
    // clampDb(25) = 18, so average = 18 dB → 10^(18/20)
    const expected = Math.pow(10, 18 / 20);
    expect(getProfileLevelMatchGain(conductiveModerate)).toBeCloseTo(expected, 4);
  });

  it('never exceeds the 18 dB cap for severe loss', () => {
    expect(getProfileLevelMatchGain(severeSensorineural)).toBeLessThanOrEqual(MAX_GAIN_LINEAR + 0.001);
  });

  it('conductive with asymmetric attenuation clamps per ear before averaging', () => {
    const profile = {
      bypass: false,
      isConductive: true,
      flatAttenuationL: 10,
      flatAttenuationR: 20,
    };
    // Right ear: clampDb(20) = 18 (hits cap). Left: clampDb(10) = 10.
    // Average: (10 + 18) / 2 = 14 dB → 10^(14/20)
    const expected = Math.pow(10, 14 / 20);
    expect(getProfileLevelMatchGain(profile)).toBeCloseTo(expected, 4);
  });
});
