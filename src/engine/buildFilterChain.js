/**
 * engine/buildFilterChain.js
 *
 * Creates the per-playback audio node graph for a given hearing profile.
 * Returns a consistent interface regardless of profile type, and accepts
 * any BaseAudioContext subclass (AudioContext or OfflineAudioContext).
 *
 * Three signal paths:
 *  1. bypass        — profile.bypass === true (Normal Hearing)
 *  2. conductive    — profile.isConductive === true
 *  3. sensorineural — everything else
 *
 * WorkletNode integration:
 *  If workletReady === true, an AudioWorkletNode is inserted at the end of
 *  each active path so tinnitus can be injected consistently. If false, each
 *  path connects directly to the merger — full graceful degradation.
 */

import {
  FREQUENCIES,
  RETSPL_CORRECTION,
  MAX_ATTENUATION,
  getEffectiveQ,
} from '../constants/frequencies.js';

const CALIBRATION_EPSILON_DB = 0.1;
const CALIBRATION_MAX_PASSES = 4;
const CALIBRATION_TOLERANCE_DB = 0.25;

function clampAttenuation(db) {
  return Math.max(0, Math.min(MAX_ATTENUATION, db));
}

function getSensorineuralBandTargets(lossArr) {
  return FREQUENCIES.map((freq, i) => {
    const corrected = Math.max(0, lossArr[i] - RETSPL_CORRECTION[i]);
    return {
      center: freq,
      target: clampAttenuation(corrected),
      q: getEffectiveQ(i, corrected),
    };
  });
}

function getPeakingResponseDb(sampleRate, testFreq, centerFreq, q, gainDb) {
  if (gainDb === 0) return 0;

  const A = Math.pow(10, gainDb / 40);
  const w0 = (2 * Math.PI * centerFreq) / sampleRate;
  const cosW0 = Math.cos(w0);
  const sinW0 = Math.sin(w0);
  const alpha = sinW0 / (2 * q);

  let b0 = 1 + alpha * A;
  let b1 = -2 * cosW0;
  let b2 = 1 - alpha * A;
  let a0 = 1 + alpha / A;
  let a1 = -2 * cosW0;
  let a2 = 1 - alpha / A;

  b0 /= a0; b1 /= a0; b2 /= a0;
  a1 /= a0; a2 /= a0;

  const w = (2 * Math.PI * testFreq) / sampleRate;
  const cosW = Math.cos(w);
  const sinW = Math.sin(w);
  const cos2W = Math.cos(2 * w);
  const sin2W = Math.sin(2 * w);

  const numRe = b0 + b1 * cosW + b2 * cos2W;
  const numIm = -b1 * sinW - b2 * sin2W;
  const denRe = 1 + a1 * cosW + a2 * cos2W;
  const denIm = -a1 * sinW - a2 * sin2W;

  return 20 * Math.log10(
    Math.hypot(numRe, numIm) / Math.hypot(denRe, denIm)
  );
}

function solveLinearSystem(matrix, values) {
  const n = values.length;
  const augmented = matrix.map((row, i) => [...row, values[i]]);

  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(augmented[row][col]) > Math.abs(augmented[pivot][col])) {
        pivot = row;
      }
    }

    if (Math.abs(augmented[pivot][col]) < 1e-8) return null;

    [augmented[col], augmented[pivot]] = [augmented[pivot], augmented[col]];

    const divisor = augmented[col][col];
    for (let j = col; j <= n; j++) augmented[col][j] /= divisor;

    for (let row = 0; row < n; row++) {
      if (row === col) continue;
      const factor = augmented[row][col];
      for (let j = col; j <= n; j++) {
        augmented[row][j] -= factor * augmented[col][j];
      }
    }
  }

  return augmented.map((row) => row[n]);
}

function evaluateCascadeAttenuation(sampleRate, bands, attenuations) {
  return FREQUENCIES.map((testFreq) =>
    bands.reduce((sum, band, i) => (
      sum - getPeakingResponseDb(
        sampleRate,
        testFreq,
        band.center,
        band.q,
        -attenuations[i]
      )
    ), 0)
  );
}

function buildCalibrationMatrix(sampleRate, bands, attenuations = null) {
  if (!attenuations) {
    return FREQUENCIES.map((testFreq) =>
      bands.map((band) => (
        -getPeakingResponseDb(sampleRate, testFreq, band.center, band.q, -1)
      ))
    );
  }

  const base = evaluateCascadeAttenuation(sampleRate, bands, attenuations);
  return FREQUENCIES.map((testFreq, rowIndex) =>
    bands.map((band, bandIndex) => {
      const next = [...attenuations];
      next[bandIndex] += CALIBRATION_EPSILON_DB;
      const delta = evaluateCascadeAttenuation(sampleRate, bands, next)[rowIndex] - base[rowIndex];
      return delta / CALIBRATION_EPSILON_DB;
    })
  );
}

function calibrateBandAttenuations(sampleRate, bands) {
  const targets = bands.map((band) => band.target);
  const initialMatrix = buildCalibrationMatrix(sampleRate, bands);
  const initial = solveLinearSystem(initialMatrix, targets);

  if (!initial) return targets;

  let attenuations = initial.map(clampAttenuation);

  for (let pass = 0; pass < CALIBRATION_MAX_PASSES; pass++) {
    const actual = evaluateCascadeAttenuation(sampleRate, bands, attenuations);
    const error = targets.map((target, i) => target - actual[i]);
    const maxError = Math.max(...error.map((value) => Math.abs(value)));

    if (maxError <= CALIBRATION_TOLERANCE_DB) break;

    const jacobian = buildCalibrationMatrix(sampleRate, bands, attenuations);
    const delta = solveLinearSystem(jacobian, error);
    if (!delta) break;

    attenuations = attenuations.map((value, i) => clampAttenuation(value + delta[i]));
  }

  return attenuations;
}

// Cache calibration results — key: "<sampleRate>:<lossArr csv>"
// Avoids re-solving on in-place profile switches during live playback.
const _bandsCache = new Map();

export function buildSensorineuralBands(sampleRate, lossArr) {
  const key = `${sampleRate}:${lossArr.join(',')}`;
  if (_bandsCache.has(key)) return _bandsCache.get(key);
  const bands = getSensorineuralBandTargets(lossArr);
  const attenuations = calibrateBandAttenuations(sampleRate, bands);
  const result = bands.map((band, i) => ({ ...band, attenuation: attenuations[i] }));
  _bandsCache.set(key, result);
  return result;
}

export { getPeakingResponseDb, evaluateCascadeAttenuation, solveLinearSystem, calibrateBandAttenuations };

/**
 * @param {BaseAudioContext} ctx
 * @param {HearingProfile} profile
 * @param {boolean} workletReady  — has audioWorklet.addModule() resolved?
 * @returns {{
 *   input:    AudioNode,
 *   output:   AudioNode,
 *   filtersL: BiquadFilterNode[],
 *   filtersR: BiquadFilterNode[],
 *   workletL: AudioWorkletNode|null,
 *   workletR: AudioWorkletNode|null,
 *   cleanup:  Function,
 * }}
 */
export function buildFilterChain(ctx, profile, workletReady = false) {

  // ── Worklet factory helper ────────────────────────────────────────────────
  const makeWorkletPair = () => {
    if (!workletReady) return { workletL: null, workletR: null };
    try {
      const opts = { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [1] };
      return {
        workletL: new AudioWorkletNode(ctx, 'hearing-processor', opts),
        workletR: new AudioWorkletNode(ctx, 'hearing-processor', opts),
      };
    } catch (err) {
      console.warn('[buildFilterChain] AudioWorkletNode creation failed:', err);
      return { workletL: null, workletR: null };
    }
  };

  // ── Bypass path ───────────────────────────────────────────────────────────
  if (profile.bypass) {
    const splitter = ctx.createChannelSplitter(2);
    const merger   = ctx.createChannelMerger(2);
    const { workletL, workletR } = makeWorkletPair();

    if (workletL && workletR) {
      splitter.connect(workletL, 0);
      splitter.connect(workletR, 1);
      workletL.connect(merger, 0, 0);
      workletR.connect(merger, 0, 1);
    } else {
      splitter.connect(merger, 0, 0);
      splitter.connect(merger, 0, 1);
    }

    return {
      input: splitter, output: merger,
      filtersL: [], filtersR: [],
      workletL, workletR,
      cleanup: () => {
        try {
          splitter.disconnect(); merger.disconnect();
          if (workletL) workletL.disconnect();
          if (workletR) workletR.disconnect();
        } catch (_) {}
      },
    };
  }

  // ── Conductive path ───────────────────────────────────────────────────────
  // Flat gain reduction only — no frequency shaping, no phase artifacts.
  // Worklet nodes are added after the gain so tinnitus can be injected.
  if (profile.isConductive) {
    const splitter = ctx.createChannelSplitter(2);
    const merger   = ctx.createChannelMerger(2);
    const gainL    = ctx.createGain();
    const gainR    = ctx.createGain();
    const { workletL, workletR } = makeWorkletPair();

    const attL = profile.flatAttenuationL ?? 30;
    const attR = profile.flatAttenuationR ?? 30;
    gainL.gain.value = Math.pow(10, -attL / 20);
    gainR.gain.value = Math.pow(10, -attR / 20);

    splitter.connect(gainL, 0);
    splitter.connect(gainR, 1);

    if (workletL && workletR) {
      gainL.connect(workletL);
      gainR.connect(workletR);
      workletL.connect(merger, 0, 0);
      workletR.connect(merger, 0, 1);
    } else {
      gainL.connect(merger, 0, 0);
      gainR.connect(merger, 0, 1);
    }

    return {
      input: splitter, output: merger,
      filtersL: [], filtersR: [],
      workletL, workletR,
      cleanup: () => {
        try {
          splitter.disconnect(); gainL.disconnect(); gainR.disconnect(); merger.disconnect();
          if (workletL) workletL.disconnect();
          if (workletR) workletR.disconnect();
        } catch (_) {}
      },
    };
  }

  // ── Sensorineural path ────────────────────────────────────────────────────
  const splitter = ctx.createChannelSplitter(2);
  const merger   = ctx.createChannelMerger(2);

  const createBandFilters = (lossArr) => {
    const bands = buildSensorineuralBands(ctx.sampleRate, lossArr);
    return bands.map((band) => {
      const f      = ctx.createBiquadFilter();
      f.type       = 'peaking';
      f.frequency.value = band.center;
      f.Q.value         = band.q;
      f.gain.value      = -band.attenuation;
      return f;
    });
  };

  const filtersL = createBandFilters(profile.left);
  const filtersR = createBandFilters(profile.right);

  // Chain filters in series: splitter → f[0] → f[1] → ... → f[7] → (worklet or merger)
  const wireSerial = (filters, splitterChannel, workletNode, mergerChannel) => {
    splitter.connect(filters[0], splitterChannel);
    for (let i = 0; i < filters.length - 1; i++) {
      filters[i].connect(filters[i + 1]);
    }
    const lastFilter = filters[filters.length - 1];
    if (workletNode) {
      lastFilter.connect(workletNode);
      workletNode.connect(merger, 0, mergerChannel);
    } else {
      lastFilter.connect(merger, 0, mergerChannel);
    }
  };

  const { workletL, workletR } = makeWorkletPair();

  wireSerial(filtersL, 0, workletL, 0);
  wireSerial(filtersR, 1, workletR, 1);

  const cleanup = () => {
    try {
      splitter.disconnect();
      merger.disconnect();
      filtersL.forEach(f => f.disconnect());
      filtersR.forEach(f => f.disconnect());
      if (workletL) workletL.disconnect();
      if (workletR) workletR.disconnect();
    } catch (_) {}
  };

  return { input: splitter, output: merger, filtersL, filtersR, workletL, workletR, cleanup };
}

/**
 * Apply a preset change to an already-running filter chain without
 * interrupting playback. Smoothly ramps gain and Q values over 80ms.
 *
 * @param {BiquadFilterNode[]} filters  One ear's filter array
 * @param {number[]} lossArr            dB HL values for that ear
 * @param {AudioContext} ctx
 */
export function applyProfileToFilters(filters, lossArr, ctx) {
  const now = ctx.currentTime;
  const RAMP_TIME = 0.08; // 80ms — avoids clicks, fast enough to feel responsive
  const bands = buildSensorineuralBands(ctx.sampleRate, lossArr);

  filters.forEach((f, i) => {
    // Cancel any scheduled values then ramp smoothly
    f.gain.cancelScheduledValues(now);
    f.gain.setValueAtTime(f.gain.value, now);
    f.gain.linearRampToValueAtTime(-bands[i].attenuation, now + RAMP_TIME);

    f.Q.cancelScheduledValues(now);
    f.Q.setValueAtTime(f.Q.value, now);
    f.Q.linearRampToValueAtTime(bands[i].q, now + RAMP_TIME);
  });
}
