/**
 * utils/levelMatching.js
 *
 * Optional loudness compensation for A/B listening.
 * This does not try to "fix" the hearing loss profile. It applies a capped
 * makeup gain so users can compare spectral changes without every profile
 * becoming dramatically quieter than the Normal Hearing reference.
 */

import {
  MAX_ATTENUATION,
  RETSPL_CORRECTION,
} from '../constants/frequencies.js';

const LEVEL_MATCH_MAX_GAIN_DB = 18;

// Emphasises the speech-heavy middle frequencies without fully ignoring bass
// and treble content.
const SPEECH_WEIGHTING = [0.05, 0.15, 0.2, 0.22, 0.18, 0.12, 0.06, 0.02];

function clampDb(db) {
  return Math.max(0, Math.min(db, LEVEL_MATCH_MAX_GAIN_DB));
}

function weightedAverage(values, weights) {
  let total = 0;
  let weightSum = 0;

  for (let i = 0; i < values.length; i++) {
    const weight = weights[i] ?? 0;
    total += values[i] * weight;
    weightSum += weight;
  }

  return weightSum > 0 ? total / weightSum : 0;
}

function getEffectiveAttenuation(lossArr) {
  if (!Array.isArray(lossArr)) return Array(8).fill(0);
  return lossArr.map((loss, i) => (
    Math.max(0, Math.min(MAX_ATTENUATION, loss - RETSPL_CORRECTION[i]))
  ));
}

function getEarMatchDb(profile, side) {
  if (!profile || profile.bypass) return 0;

  if (profile.isConductive) {
    const flatDb = side === 'left'
      ? profile.flatAttenuationL
      : profile.flatAttenuationR;
    return clampDb(flatDb ?? 0);
  }

  const losses = side === 'left' ? profile.left : profile.right;
  return clampDb(weightedAverage(getEffectiveAttenuation(losses), SPEECH_WEIGHTING));
}

export function getProfileLevelMatchGain(profile) {
  if (!profile || profile.bypass) return 1;

  const leftDb = getEarMatchDb(profile, 'left');
  const rightDb = getEarMatchDb(profile, 'right');
  const matchDb = (leftDb + rightDb) / 2;

  return Math.pow(10, matchDb / 20);
}
