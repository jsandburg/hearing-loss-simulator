/**
 * hearing-processor.js
 * AudioWorklet processor for the Hearing Loss Simulator.
 *
 * IMPORTANT: This file runs in the AudioWorklet global scope — a completely
 * separate JavaScript environment from the main React app. There is NO:
 *   - import / require
 *   - DOM access
 *   - React state
 *   - window / document
 *
 * Only available globals: AudioWorkletProcessor, registerProcessor, sampleRate,
 * currentTime, currentFrame, MessagePort.
 *
 * This file must be served as a static asset (placed in /public/).
 * It is loaded via: audioContext.audioWorklet.addModule('/hearing-processor.js?v=1')
 *
 * Architecture: Filterbank (Option B — per-band isolation)
 * For each of the 8 audiogram frequency bands:
 *   1. Analysis bandpass filter measures band energy
 *   2. Threshold gate: if band energy < hearing threshold → mute that band's contribution
 *   3. Recruitment compressor: if energy > threshold → apply dynamic compression
 *   4. Temporal envelope smearing via envelope low-pass filter + reimposition
 * Then on the full mixed signal:
 *   5. Temporal fine structure degradation (LCG noise injection)
 *   6. Tinnitus tone addition
 *   7. Hard clip to [-1, 1]
 */

'use strict';

// ─── Constants ──────────────────────────────────────────────────────────────

const NUM_BANDS    = 8;
const FREQUENCIES  = [250, 500, 1000, 2000, 3000, 4000, 6000, 8000];
// Per-band Q values calculated from audiogram frequency spacing
const BAND_Q       = [1.41, 1.42, 1.41, 1.93, 2.96, 2.79, 2.96, 3.86];
// Cochlear dynamic range above threshold (dB) for recruitment compression
const COCHLEAR_DR  = 20.0;
// Normal dynamic range (dB)
const NORMAL_DR    = 120.0;
// Envelope follower smoothing — per-sample coefficient (very slow attack/release)
const ENV_ATTACK   = 0.9995;
const ENV_RELEASE  = 0.9990;

// ─── Biquad Filter Utilities ─────────────────────────────────────────────────
// Direct-form II transposed biquad implementation.
// Each filter state: { b0, b1, b2, a1, a2, z1, z2 }

function makeBandpassCoeffs(freq, Q, sr) {
  // RBJ bandpass (constant 0 dB peak) cookbook formula
  const w0    = 2 * Math.PI * freq / sr;
  const alpha = Math.sin(w0) / (2 * Q);
  const b0    =  alpha;
  const b1    =  0;
  const b2    = -alpha;
  const a0    =  1 + alpha;
  const a1    = -2 * Math.cos(w0);
  const a2    =  1 - alpha;
  return {
    b0: b0 / a0, b1: b1 / a0, b2: b2 / a0,
    a1: a1 / a0, a2: a2 / a0,
    z1: 0, z2: 0,
  };
}

function tickBiquad(f, x) {
  // Process one sample through a biquad filter state object.
  // Returns filtered sample, mutates f.z1 and f.z2 in place.
  const y = f.b0 * x + f.z1;
  f.z1    = f.b1 * x - f.a1 * y + f.z2;
  f.z2    = f.b2 * x - f.a2 * y;
  return y;
}

function resetBiquad(f) {
  f.z1 = 0;
  f.z2 = 0;
}

// ─── LCG Noise Generator ─────────────────────────────────────────────────────
// Linear congruential generator. Faster than Math.random() on the audio thread
// and deterministic. Produces values in [-1, 1].

class LCGNoise {
  constructor() {
    this.state = (Math.random() * 0xFFFFFFFF) >>> 0;
  }
  next() {
    // Knuth's multiplicative LCG
    this.state = (Math.imul(this.state, 1664525) + 1013904223) >>> 0;
    return (this.state / 0x7FFFFFFF) - 1.0;
  }
}

// ─── HearingProcessor ────────────────────────────────────────────────────────

class HearingProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super(options);

    // ── Parameters (updated via MessagePort) ──────────────────────────────
    // thresholds: Float32Array[8] — hearing threshold per band in dB HL
    // recruitment: bool — enable abnormal loudness growth compression
    // smearingHz: number — envelope LPF cutoff (Hz). 150=normal, 8=profound
    // fineStructure: number 0–1 — phase noise injection amount
    // tinnitus: { enabled, frequency, level }
    this.thresholds    = new Float32Array(NUM_BANDS); // all 0 = no gating
    this.recruitment   = false;
    this.smearingHz    = 150;  // 150 Hz = normal (no smearing)
    this.fineStructure = 0;
    this.tinnitus      = { enabled: false, frequency: 4000, level: 0 };

    // ── Analysis filterbank ────────────────────────────────────────────────
    // One bandpass biquad per band. Used to measure per-band energy.
    this.analysisFilters = FREQUENCIES.map((f, i) =>
      makeBandpassCoeffs(f, BAND_Q[i], sampleRate)
    );

    // ── Reconstruction filterbank ──────────────────────────────────────────
    // Matched pair to analysis filters. Used to reconstruct the output
    // from gated/compressed per-band signals.
    this.reconstructFilters = FREQUENCIES.map((f, i) =>
      makeBandpassCoeffs(f, BAND_Q[i], sampleRate)
    );

    // ── Per-band state ─────────────────────────────────────────────────────
    this.bandEnergy       = new Float32Array(NUM_BANDS); // RMS per band
    this.bandEnvelopes    = new Float32Array(NUM_BANDS); // envelope followers

    // ── Temporal envelope smearing state ──────────────────────────────────
    // Per-band envelope low-pass filters (one-pole IIR)
    this.smearEnv         = new Float32Array(NUM_BANDS); // smeared envelope
    this.smearCoeff       = this._smearCoeff(150);       // derived from smearingHz

    // ── Fine structure noise ───────────────────────────────────────────────
    this.noise = new LCGNoise();

    // ── Tinnitus oscillator ────────────────────────────────────────────────
    this.tinnitusPhase = 0;

    // ── Message handler — receives parameter updates from React ───────────
    this.port.onmessage = (e) => {
      const d = e.data;
      if (!d) return;

      if (d.thresholds) {
        // Accept plain array or Float32Array
        for (let i = 0; i < NUM_BANDS; i++) {
          this.thresholds[i] = Number(d.thresholds[i] ?? 0);
        }
      }
      if ('recruitment'   in d) this.recruitment   = Boolean(d.recruitment);
      if ('smearingHz'    in d) {
        this.smearingHz  = Math.max(1, Math.min(200, Number(d.smearingHz)));
        this.smearCoeff  = this._smearCoeff(this.smearingHz);
      }
      if ('fineStructure' in d) this.fineStructure = Math.max(0, Math.min(1, Number(d.fineStructure)));
      if ('tinnitus'      in d) {
        this.tinnitus = {
          enabled:   Boolean(d.tinnitus.enabled),
          frequency: Math.max(20, Math.min(20000, Number(d.tinnitus.frequency ?? 4000))),
          level:     Math.max(0,  Math.min(1,     Number(d.tinnitus.level     ?? 0))),
        };
      }
    };
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  _smearCoeff(cutoffHz) {
    // One-pole IIR low-pass coefficient for envelope follower.
    // coeff = exp(-2π * cutoff / sampleRate)
    // High cutoff (150 Hz) → coeff near 1 → fast tracking (no smearing)
    // Low cutoff (8 Hz)    → coeff near 1 → slow tracking (heavy smearing)
    return Math.exp(-2 * Math.PI * cutoffHz / sampleRate);
  }

  _dbToLinear(db) {
    return Math.pow(10, db / 20);
  }

  _linearToDb(lin) {
    return 20 * Math.log10(Math.max(1e-10, lin));
  }

  _applyRecruitmentGain(inputLevel, thresholdDb) {
    // Inputs: inputLevel in linear, thresholdDb in dB HL
    // Returns a gain factor to apply to the signal.
    //
    // Above threshold, cochlear dynamic range is compressed from NORMAL_DR
    // to COCHLEAR_DR. Ratio = NORMAL_DR / COCHLEAR_DR = 6:1.
    // This means the band goes from just-audible to maximally-loud over
    // only 20 dB of input change instead of the normal 120 dB.
    if (thresholdDb <= 0) return 1.0; // no threshold, no recruitment

    const threshLin = this._dbToLinear(-thresholdDb); // threshold as linear amplitude
    if (inputLevel <= threshLin) return 0.0;          // below threshold: silence

    const excessDb    = this._linearToDb(inputLevel / threshLin);
    const ratio       = NORMAL_DR / COCHLEAR_DR;
    const compressedDb = excessDb / ratio;
    return this._dbToLinear(compressedDb) * threshLin / inputLevel;
  }

  // ── Main process loop ──────────────────────────────────────────────────────

  process(inputs, outputs) {
    const inputChannel  = inputs[0]?.[0];
    const outputChannel = outputs[0]?.[0];

    if (!inputChannel || !outputChannel) return true;

    const blockSize = inputChannel.length; // always 128

    // ── Step 1: Measure per-band energy (RMS over block) ──────────────────
    // We save and restore the analysis filter state after measurement so that
    // the energy probe is effectively stateless — preventing state drift that
    // would cause threshold gating decisions to be based on stale energy estimates.
    for (let b = 0; b < NUM_BANDS; b++) {
      const af    = this.analysisFilters[b];
      const savedZ1 = af.z1;
      const savedZ2 = af.z2;

      let sumSq = 0;
      for (let i = 0; i < blockSize; i++) {
        const s = tickBiquad(af, inputChannel[i]);
        sumSq += s * s;
      }

      // Restore state: next block's energy measurement starts from the same
      // point as this block, keeping measurement independent of reconstruction
      af.z1 = savedZ1;
      af.z2 = savedZ2;

      this.bandEnergy[b] = Math.sqrt(sumSq / blockSize);
    }

    // ── Step 2: Process each sample ───────────────────────────────────────
    // Hoist tinnitus phase increment — constant within a block
    this._tinnitusPhaseInc = this.tinnitus.enabled
      ? (2 * Math.PI * this.tinnitus.frequency) / sampleRate
      : 0;

    for (let i = 0; i < blockSize; i++) {
      const x = inputChannel[i];

      // Reconstruct signal as sum of gated/compressed frequency bands
      let reconstructed = 0;

      for (let b = 0; b < NUM_BANDS; b++) {
        const bandSample = tickBiquad(this.reconstructFilters[b], x);
        const energy     = this.bandEnergy[b];
        const threshDb   = this.thresholds[b];

        let gain;
        if (this.recruitment) {
          gain = this._applyRecruitmentGain(energy, threshDb);
        } else if (threshDb > 0) {
          // Threshold gating without recruitment: below threshold → silence
          const threshLin = this._dbToLinear(-threshDb);
          gain = energy < threshLin ? 0.0 : 1.0;
        } else {
          gain = 1.0;
        }

        // Temporal envelope smearing
        // Track the instantaneous envelope of this band using a standard
        // one-pole IIR follower with separate attack and release time constants.
        // attack is fast (ENV_ATTACK near 1 → fast rise),
        // release is slow (ENV_RELEASE near 1 → slow decay).
        const instEnv  = Math.abs(bandSample);
        const prevEnv  = this.bandEnvelopes[b];
        const trackedEnv = instEnv > prevEnv
          ? ENV_ATTACK  * prevEnv + (1 - ENV_ATTACK)  * instEnv  // attack: fast
          : ENV_RELEASE * prevEnv + (1 - ENV_RELEASE) * instEnv; // release: slow
        this.bandEnvelopes[b] = trackedEnv;

        // Smear the envelope via one-pole LPF
        const c = this.smearCoeff;
        this.smearEnv[b] = c * this.smearEnv[b] + (1 - c) * this.bandEnvelopes[b];

        // Reimpose smeared envelope onto the band signal
        let processedBand;
        if (this.smearingHz < 148 && instEnv > 1e-8) {
          // Scale signal so its envelope matches the smeared (slower) version
          processedBand = bandSample * (this.smearEnv[b] / instEnv);
        } else {
          processedBand = bandSample;
        }

        reconstructed += processedBand * gain;
      }

      // ── Step 3: Temporal fine structure degradation ────────────────────
      let sample = reconstructed;
      if (this.fineStructure > 0) {
        // Inject phase-incoherent noise scaled to signal envelope.
        // Preserves loudness but destroys pitch/timing information.
        const noiseVal  = this.noise.next();
        const envAmp    = Math.abs(sample);
        sample = sample  * (1.0 - this.fineStructure)
               + noiseVal * this.fineStructure * envAmp * 3.0;
      }

      // ── Step 4: Tinnitus tone ──────────────────────────────────────────
      // phaseInc is hoisted before the loop (see _tinnitusPhaseInc below)
      if (this.tinnitus.enabled && this.tinnitus.level > 0) {
        sample            += Math.sin(this.tinnitusPhase) * this.tinnitus.level * 0.15;
        this.tinnitusPhase = (this.tinnitusPhase + this._tinnitusPhaseInc) % (2 * Math.PI);
      }

      // ── Step 5: Hard clip to [-1, 1] ──────────────────────────────────
      // Fine structure noise injection can push levels above ±1.
      // The downstream SafetyLimiter in React catches larger issues,
      // but we clamp here too to keep the worklet output clean.
      outputChannel[i] = sample < -1.0 ? -1.0 : sample > 1.0 ? 1.0 : sample;
    }

    return true; // keep processor alive
  }
}

registerProcessor('hearing-processor', HearingProcessor);
