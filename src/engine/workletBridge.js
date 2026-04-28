/**
 * engine/workletBridge.js
 *
 * All communication between React state and the AudioWorkletNode instances
 * flows through this module. It is the single authoritative place where:
 *  - Tinnitus UI values are validated before sending
 *  - Messages are sent to both left and right worklet nodes together
 *
 * NEVER call workletNode.port.postMessage() directly from component code.
 * Always use sendWorkletParams() so both ears stay in sync.
 *
 * The worklet's only job is tinnitus tone injection. Frequency-selective
 * attenuation is handled entirely by the BiquadFilter peaking-EQ chain in
 * buildFilterChain.js — the worklet receives the already-processed signal.
 */

/**
 * Send worklet parameters to both ear nodes.
 *
 * @param {AudioWorkletNode|null} workletL
 * @param {AudioWorkletNode|null} workletR
 * @param {HearingProfile} profile
 * @param {object} overrides  — tinnitus overrides from user sliders
 */
export function sendWorkletParams(workletL, workletR, profile, overrides = {}) {
  if (!workletL && !workletR) return;

  const pw = profile?.worklet ?? {};
  const pt = pw.tinnitus ?? {};

  const tinnitus = {
    enabled:   Boolean(overrides.tinnitus?.enabled   ?? pt.enabled),
    frequency: Number(overrides.tinnitus?.frequency  ?? pt.frequency ?? 4000),
    level:     Math.max(0, Math.min(1, Number(overrides.tinnitus?.level ?? pt.level ?? 0))),
  };

  const msg = { tinnitus };

  if (workletL) workletL.port.postMessage(msg);
  if (workletR) workletR.port.postMessage(msg);
}

// ─── UI label helpers ─────────────────────────────────────────────────────────

export function tinnitusLevelLabel(v) {
  if (v === 0)   return 'Off';
  if (v < 0.2)   return 'Faint';
  if (v < 0.4)   return 'Moderate';
  if (v < 0.7)   return 'Loud';
  return 'Very Loud';
}
