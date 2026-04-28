import { describe, it, expect } from 'vitest';
import { encodePresetToUrl, decodePresetFromUrl } from './presetUrlEncoding.js';

const baseProfile = {
  id: 'test',
  name: 'Test Profile',
  left:  [0, 5, 10, 20, 30, 40, 45, 50],
  right: [0, 5, 10, 20, 30, 40, 45, 50],
  category: 'sensorineural',
  bypass: false,
  isConductive: false,
  flatAttenuationL: null,
  flatAttenuationR: null,
  worklet: { tinnitus: { enabled: false, frequency: 4000, level: 0.15 } },
};

function roundTrip(profile) {
  return decodePresetFromUrl(encodePresetToUrl(profile));
}

// ─── Round-trip integrity ──────────────────────────────────────────────────────

describe('presetUrlEncoding round-trip', () => {
  it('preserves audiogram values', () => {
    const decoded = roundTrip(baseProfile);
    expect(decoded.left).toEqual(baseProfile.left);
    expect(decoded.right).toEqual(baseProfile.right);
  });

  it('preserves name', () => {
    const decoded = roundTrip(baseProfile);
    expect(decoded.name).toBe('Test Profile');
  });

  it('preserves category', () => {
    const decoded = roundTrip(baseProfile);
    expect(decoded.category).toBe('sensorineural');
  });

  it('preserves bypass flag — normal hearing stays bypass', () => {
    const normal = { ...baseProfile, bypass: true, left: Array(8).fill(0), right: Array(8).fill(0) };
    const decoded = roundTrip(normal);
    expect(decoded.bypass).toBe(true);
  });

  it('preserves isConductive flag and flat attenuations', () => {
    const conductive = {
      ...baseProfile,
      isConductive: true,
      flatAttenuationL: 15,
      flatAttenuationR: 15,
    };
    const decoded = roundTrip(conductive);
    expect(decoded.isConductive).toBe(true);
    expect(decoded.flatAttenuationL).toBe(15);
    expect(decoded.flatAttenuationR).toBe(15);
  });

  it('preserves tinnitus settings when enabled', () => {
    const withTinnitus = {
      ...baseProfile,
      worklet: { tinnitus: { enabled: true, frequency: 6000, level: 0.4 } },
    };
    const decoded = roundTrip(withTinnitus);
    expect(decoded.worklet.tinnitus.enabled).toBe(true);
    expect(decoded.worklet.tinnitus.frequency).toBe(6000);
    expect(decoded.worklet.tinnitus.level).toBeCloseTo(0.4, 2);
  });

  it('flatAttenuationL/R are null in decoded output when not conductive', () => {
    const decoded = roundTrip(baseProfile);
    expect(decoded.flatAttenuationL).toBeNull();
    expect(decoded.flatAttenuationR).toBeNull();
  });

  it('asymmetric audiogram preserves both ears independently', () => {
    const asymmetric = {
      ...baseProfile,
      left:  [0, 0, 10, 25, 65, 75, 55, 30],
      right: [0, 0, 5,  10, 30, 35, 25, 15],
    };
    const decoded = roundTrip(asymmetric);
    expect(decoded.left).toEqual(asymmetric.left);
    expect(decoded.right).toEqual(asymmetric.right);
  });
});

// ─── Decode error cases ────────────────────────────────────────────────────────

describe('decodePresetFromUrl error handling', () => {
  it('returns null for empty string', () => {
    expect(decodePresetFromUrl('')).toBeNull();
  });

  it('returns null for null/undefined', () => {
    expect(decodePresetFromUrl(null)).toBeNull();
    expect(decodePresetFromUrl(undefined)).toBeNull();
  });

  it('returns null for garbage input', () => {
    expect(decodePresetFromUrl('not-base64!!')).toBeNull();
  });

  it('returns null for valid base64 but not JSON', () => {
    expect(decodePresetFromUrl(btoa('hello world'))).toBeNull();
  });

  it('returns null for wrong version number', () => {
    const encoded = encodePresetToUrl(baseProfile);
    const decoded = decodePresetFromUrl(encoded);
    // Manually craft a version-2 payload to verify version check
    const payload = { v: 2, n: 'x', l: Array(8).fill(0), r: Array(8).fill(0), cat: 'sensorineural', bp: 0, cond: 0, wk: { ten: 0, tF: 4000, tL: 0.15 } };
    const json = JSON.stringify(payload);
    const b64 = btoa(json).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    expect(decodePresetFromUrl(b64)).toBeNull();
  });

  it('returns null when left array has wrong length', () => {
    const payload = { v: 1, n: 'x', l: [0, 0, 0], r: Array(8).fill(0), cat: 'sensorineural', bp: 0, cond: 0, wk: { ten: 0, tF: 4000, tL: 0.15 } };
    const b64 = btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    expect(decodePresetFromUrl(b64)).toBeNull();
  });
});
