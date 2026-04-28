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
 *  If workletReady === true, an AudioWorkletNode is inserted after the
 *  BiquadFilter chain for sensorineural profiles. If false, the BiquadFilters
 *  connect directly to the merger — full graceful degradation.
 *
 * Conductive and bypass paths never use the worklet.
 */

import {
  FREQUENCIES,
  RETSPL_CORRECTION,
  MAX_ATTENUATION,
  getEffectiveQ,
} from '../constants/frequencies.js';

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

  const createBandFilters = (lossArr) =>
    FREQUENCIES.map((freq, i) => {
      const f      = ctx.createBiquadFilter();
      f.type       = 'peaking';
      f.frequency.value = freq;
      const corrected   = Math.max(0, lossArr[i] - RETSPL_CORRECTION[i]);
      const clamped     = Math.min(MAX_ATTENUATION, corrected);
      f.Q.value         = getEffectiveQ(i, corrected);
      f.gain.value      = -clamped;
      return f;
    });

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

  filters.forEach((f, i) => {
    const corrected = Math.max(0, lossArr[i] - RETSPL_CORRECTION[i]);
    const clamped   = Math.min(MAX_ATTENUATION, corrected);
    const q         = getEffectiveQ(i, corrected);

    // Cancel any scheduled values then ramp smoothly
    f.gain.cancelScheduledValues(now);
    f.gain.setValueAtTime(f.gain.value, now);
    f.gain.linearRampToValueAtTime(-clamped, now + RAMP_TIME);

    f.Q.cancelScheduledValues(now);
    f.Q.setValueAtTime(f.Q.value, now);
    f.Q.linearRampToValueAtTime(q, now + RAMP_TIME);
  });
}
